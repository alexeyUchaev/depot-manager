// app/api/chat/route.ts
import { GoogleGenAI } from "@google/genai";
import { revalidatePath } from "next/cache";
import { depotTools } from "@/lib/ai-tools";
import { executeTool } from "@/lib/ai-executor";

export const runtime = "nodejs"; // нужен node-рантайм для executeTool/revalidatePath

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  console.log("✅ /api/chat ВЫЗВАН"); // <-- ищи это в ТЕРМИНАЛЕ (где npm run dev)

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, content: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, content })}\n\n`)
        );
      };

      try {
        if (!process.env.GEMINI_API_KEY) {
          send("error", "GEMINI_API_KEY не задан в .env.local (и нужен рестарт сервера)");
          return;
        }

        const { messages } = await req.json();
        console.log("📨 messages:", messages?.length);

        if (!Array.isArray(messages) || messages.length === 0) {
          send("error", "Пустой массив сообщений");
          return;
        }

        // Отделяем последнее сообщение пользователя от истории
        const history = [...messages];
        const lastMessageObj = history.pop();
        const userMessage = lastMessageObj?.parts?.[0]?.text ?? "";

        if (!userMessage.trim()) {
          send("error", "Пустое сообщение пользователя");
          return;
        }

        // НОВЫЙ SDK: чат создаётся через ai.chats.create
        const chat = ai.chats.create({
          model: "gemini-2.5-flash",
          history,
          config: {
            tools: [{ functionDeclarations: depotTools }],
          },
        });

        // message передаётся объектом, а не строкой!
        const result = await chat.sendMessage({ message: userMessage });

        // functionCalls и text — свойства, без .response и без ()
        const call = result.functionCalls?.[0];

        if (call) {
          console.log("🔧 tool call:", call.name);
          send("tool_call", { tool: call.name, args: call.args });

          const toolResult = await executeTool(call.name, call.args);

          revalidatePath("/inventory");
          revalidatePath("/orders");

          const finalResult = await chat.sendMessage({
            message: [
              {
                functionResponse: {
                  name: call.name,
                  response: { result: toolResult },
                },
              },
            ],
          });

          send("text", finalResult.text ?? "");
        } else {
          send("text", result.text ?? "");
        }
      } catch (error: unknown) {
        console.error("=== BACKEND CRITICAL ERROR ===", error);
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : "Unknown Gemini API Error";
        send("error", message);
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}