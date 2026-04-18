import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/constants/persona";
import { createClient } from "@/lib/supabase/server";
import Groq from "groq-sdk";
import { analyzeUserStyle } from "@/lib/style-analyzer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse and save [LOG_MEAL:{...}] and [LOG_PR:{...}] tags embedded by AI.
 * Tags are then stripped from the text shown to the user.
 */
async function processLogTags(
  text: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  // Meal logs
  const mealRegex = /\[LOG_MEAL:(\{[^[\]]+\})\]/g;
  let mealMatch;
  while ((mealMatch = mealRegex.exec(text)) !== null) {
    try {
      const d = JSON.parse(mealMatch[1]);
      await supabase.from("calorie_logs").insert({
        user_id: userId,
        meal_name: String(d.meal_name ?? "Unknown meal"),
        calories: Number(d.calories) || 0,
        protein_g: Number(d.protein_g) || 0,
        carbs_g: Number(d.carbs_g) || 0,
        fat_g: Number(d.fat_g) || 0,
        date: new Date().toISOString().split("T")[0],
      });
    } catch {
      // Ignore malformed JSON tags
    }
  }

  // PR logs
  const prRegex = /\[LOG_PR:(\{[^[\]]+\})\]/g;
  let prMatch;
  while ((prMatch = prRegex.exec(text)) !== null) {
    try {
      const d = JSON.parse(prMatch[1]);
      await supabase.from("personal_records").insert({
        user_id: userId,
        exercise: String(d.exercise ?? "Unknown"),
        weight_kg: Number(d.weight_kg) || 0,
        reps: d.reps ? Number(d.reps) : null,
      });
    } catch {
      // Ignore malformed JSON tags
    }
  }

  // Strip tags from display text — replace with human-readable inline summary
  return text
    .replace(/\[LOG_MEAL:(\{[^[\]]+\})\]/g, (_, json) => {
      try {
        const d = JSON.parse(json);
        return `\n\n📊 **Meal logged:** ${d.meal_name} — ${d.calories} kcal | P: ${d.protein_g ?? 0}g | C: ${d.carbs_g ?? 0}g | F: ${d.fat_g ?? 0}g`;
      } catch {
        return "";
      }
    })
    .replace(/\[LOG_PR:(\{[^[\]]+\})\]/g, (_, json) => {
      try {
        const d = JSON.parse(json);
        return `\n\n🏆 **PR logged:** ${d.exercise} — ${d.weight_kg} kg${d.reps ? ` × ${d.reps} reps` : ""}`;
      } catch {
        return "";
      }
    });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured in .env.local" },
      { status: 500 }
    );
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  // ── Auth & profile ──────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, current_weight, height, fitness_goal, gym_experience, preferred_split")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { messages: { role: string; content: string }[]; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, conversationId } = body;
  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  // Limit history to last 10 exchanges to keep context window manageable
  const recentMessages = messages.slice(-10);

  // ── Build Groq messages with Style Analysis ────────────────────────────────
  const userMessagesText = recentMessages
    .filter((msg) => msg.role === "user")
    .slice(-5)
    .map((msg) => msg.content);

  const styleAnalysis = analyzeUserStyle(userMessagesText);
  const finalSystemPrompt = buildSystemPrompt(profile) + styleAnalysis;

  const formattedMessages: any[] = [
    { role: "system", content: finalSystemPrompt },
  ];

  if (userMessagesText.length >= 3) {
    formattedMessages.push({
      role: "system",
      content: `The user's recent messages show this pattern: "${userMessagesText.slice(-3).join(' | ')}". Adapt your vocabulary to match theirs exactly. Use the same words they use.`,
    });
  }

  formattedMessages.push(
    ...recentMessages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }))
  );

  // ── Save user message (fire-and-forget) ────────────────────────────────────
  const latestMessage = recentMessages[recentMessages.length - 1];
  if (user && latestMessage?.role === "user") {
    supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        role: "user",
        content: latestMessage.content,
        conversation_id: conversationId ?? null,
      })
      .then(({ error }) => {
        if (error) console.error("[/api/chat] Save user msg:", error.message);
      });
  }

  // ── Call Groq ───────────────────────────────────────────────────────
  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: formattedMessages as any,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (streamErr) {
          console.error("[/api/chat] Stream error:", streamErr);
          controller.enqueue(
            encoder.encode("\n\n[Something went wrong while streaming. Please try again.]")
          );
        } finally {
          controller.close();

          if (user && fullResponse.trim()) {
            // Process and save log tags, get cleaned text for DB storage
            const cleanedText = await processLogTags(fullResponse, user.id, supabase).catch(
              () => fullResponse
            );

            supabase
              .from("chat_messages")
              .insert({
                user_id: user.id,
                role: "assistant",
                content: cleanedText,
                conversation_id: conversationId ?? null,
              })
              .then(({ error }) => {
                if (error) console.error("[/api/chat] Save assistant msg:", error.message);
              });
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("[/api/chat] Groq error:", error);
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "RATE_LIMIT" },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}