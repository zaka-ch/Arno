import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/constants/persona";
import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncomingMessage {
  role: string;
  content: string;
  imageDataUrl?: string;
}

interface GeminiPart {
  text?: string;
  inlineData?: { data: string; mimeType: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toParts(msg: IncomingMessage): GeminiPart[] {
  const parts: GeminiPart[] = [];
  if (msg.content.trim()) parts.push({ text: msg.content });
  if (msg.imageDataUrl) {
    const [meta, data] = msg.imageDataUrl.split(",");
    const mimeType = meta.split(":")[1].split(";")[0];
    parts.push({ inlineData: { data, mimeType } });
  }
  if (parts.length === 0) parts.push({ text: "" });
  return parts;
}

/**
 * Parse and save [LOG_MEAL:{...}] and [LOG_PR:{...}] tags embedded by Gemini.
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

// ─── Model list (fallback order) ──────────────────────────────────────────────

const CANDIDATE_MODELS = [
  { apiVersion: "v1beta", model: "gemini-2.0-flash" },
  { apiVersion: "v1beta", model: "gemini-1.5-flash" },
];

const BASE_URL = "https://generativelanguage.googleapis.com";

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured in .env.local" },
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

  // Limit history to last 10 exchanges to keep context window manageable
  const recentMessages = messages.slice(-10);

  // ── Build Gemini contents ───────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(profile);

  const userContents: GeminiContent[] = recentMessages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: toParts(msg),
  }));

  // Inject system prompt as the opening exchange (compatible with all model versions)
  const contents: GeminiContent[] = [
    {
      role: "user",
      parts: [{ text: `[SYSTEM]\n${systemPrompt}\n\nAcknowledge briefly.` }],
    },
    {
      role: "model",
      parts: [{ text: "Understood — I'm ARNO, your AI fitness coach. Let's go! 💪" }],
    },
    ...userContents,
  ];

  const requestBody = {
    contents,
    generationConfig: { temperature: 0.8, topP: 0.95 },
  };

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

  // ── Try each model in fallback order ───────────────────────────────────────
  let lastError = "No working model found";

  for (const candidate of CANDIDATE_MODELS) {
    const url = `${BASE_URL}/${candidate.apiVersion}/models/${candidate.model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    console.log("Calling Gemini API", candidate.model);

    let geminiRes: Response;
    try {
      geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      console.warn("[/api/chat] Fetch error:", lastError);
      continue;
    }

    // FIX 2: specific 429 handling — return JSON so frontend shows the bubble
    if (geminiRes.status === 429) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    if (!geminiRes.ok) {
      const hint = await geminiRes.text().catch(() => "");
      lastError = `${candidate.model} ${geminiRes.status}: ${hint.slice(0, 120)}`;
      console.warn("[/api/chat]", lastError);
      continue;
    }

    // FIX 1: guard against null response body
    if (!geminiRes.body) {
      lastError = `${candidate.model}: empty response body`;
      continue;
    }

    console.log(`[/api/chat] Using ${candidate.apiVersion}/${candidate.model}`);

    // ── Stream SSE -> plain text, process log tags after completion ──────────
    const outputStream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const chunk: string =
                  parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                if (chunk) {
                  fullResponse += chunk;
                  controller.enqueue(new TextEncoder().encode(chunk));
                }
              } catch {
                /* skip malformed SSE chunk */
              }
            }
          }
        } catch (streamErr) {
          // FIX 1: stream error — enqueue error message so frontend gets something
          const errMsg = streamErr instanceof Error ? streamErr.message : "Stream error";
          console.error("[/api/chat] Stream error:", errMsg);
          controller.enqueue(
            new TextEncoder().encode("\n\n[Something went wrong while streaming. Please try again.]")
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

    return new NextResponse(outputStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // All models failed
  console.error("[/api/chat] All models exhausted:", lastError);
  return NextResponse.json({ error: lastError }, { status: 502 });
}