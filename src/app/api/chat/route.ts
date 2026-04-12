import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildSystemPrompt } from "@/constants/persona";
import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncomingMessage {
  role: string;
  content: string;
  imageDataUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse and save [LOG_MEAL:{...}] and [LOG_PR:{...}] tags embedded by the LLM.
 * Tags are then stripped from the text shown to the user.
 */
async function processLogTags(
  text: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  // Meal logs
  const mealRegex = /\[LOG_MEAL:(\{[^\[\]]+\})\]/g;
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
  const prRegex = /\[LOG_PR:(\{[^\[\]]+\})\]/g;
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
    .replace(/\[LOG_MEAL:(\{[^\[\]]+\})\]/g, (_, json) => {
      try {
        const d = JSON.parse(json);
        return `\n\n📊 **Meal logged:** ${d.meal_name} — ${d.calories} kcal | P: ${d.protein_g ?? 0}g | C: ${d.carbs_g ?? 0}g | F: ${d.fat_g ?? 0}g`;
      } catch {
        return "";
      }
    })
    .replace(/\[LOG_PR:(\{[^\[\]]+\})\]/g, (_, json) => {
      try {
        const d = JSON.parse(json);
        return `\n\n🏆 **PR logged:** ${d.exercise} — ${d.weight_kg} kg${d.reps ? ` × ${d.reps} reps` : ""}`;
      } catch {
        return "";
      }
    });
}

// ─── Groq client ──────────────────────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured." },
      { status: 500 }
    );
  }

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
  let body: { messages: IncomingMessage[]; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, conversationId } = body;
  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  // ── Build Groq messages ─────────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(profile);

  // Map conversation history to Groq format (last 10 exchanges)
  const history = messages.slice(-10).map((m) => ({
    role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
    content: m.content,
  }));

  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  // ── Save user message (fire-and-forget) ────────────────────────────────────
  const latestMessage = messages[messages.length - 1];
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

  // ── Call Groq with streaming ────────────────────────────────────────────────
  console.log("Calling Groq API — llama-3.3-70b-versatile");

  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
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
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (streamErr) {
          const errMsg = streamErr instanceof Error ? streamErr.message : "Stream error";
          console.error("[/api/chat] Stream error:", errMsg);
          controller.enqueue(
            encoder.encode("\n\n[Something went wrong while streaming. Please try again.]")
          );
        } finally {
          controller.close();

          // Save assistant response + process log tags
          if (user && fullResponse.trim()) {
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

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("[/api/chat] Groq error:", message);

    if (status === 429) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}