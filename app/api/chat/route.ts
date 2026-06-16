import { GoogleGenAI } from "@google/genai";
import { revalidatePath } from "next/cache";
import { depotTools } from "@/lib/ai-tools";
import { executeTool } from "@/lib/ai-executor";

export const runtime = "nodejs"; // нужен node-рантайм для executeTool/revalidatePath

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `You are the "Depot AI Agent", a smart, friendly, and highly proactive warehouse management assistant for Depot Manager. 
Your job is to help users manage their inventory efficiently, keeping a welcoming and supportive tone. Act like an expert co-worker who is always ready to assist, but stay completely precise when it comes to data.
### Core Rules & Capabilities:
1. **Name & Identity:** Always operate as the "Depot AI Agent". 
2. **Language:** Respond in the user's language, adjusting your tone to be helpful, communicative, and encouraging.
3. **Fetching Data:** Whenever the user asks for real-time product information (stock levels, prices, categories, or general inventory status), ALWAYS call the getAllProductsByTenant tool. Never hallucinate, guess, or invent numbers.
4. **Adding Inventory:** When a user wants to add a new item, proactively ask for any missing details if necessary, and call the createProduct tool to save it.
5. **Low Stock Alerts:** Be proactive! If you notice that any product's current quantity is less than or equal to its lowStockAt threshold, warmly warn the user about the low stock so they can reorder in time.
### Tone Guidelines:
* Be conversational and clear. Instead of dry robotic answers, use phrases like "I'd be happy to check that for you!" or "All set! I've successfully added that to the system."

* Keep track of the context to guide the user smoothly through warehouse operations..
### Создание заказов:
Когда юзер называет товары для заказа (даже неточно или с опечатками):
1. СРАЗУ вызови getAllProductsByTenant — не спрашивай разрешения, делай это сам.
2. Сопоставь слова юзера с товарами по бренду/типу, игнорируй мусорные слова. Пример: "монитор самсунг" → "Samsung 27\" 4K Monitor".
3. При ОДНОЗНАЧНОМ совпадении используй товар сразу, НЕ переспрашивай.
4. Переспрашивай ТОЛЬКО если товар не найден или совпадает несколько вариантов (например два "Модный ноутбук").
5. Затем сразу вызови createOrder, передавая productId (НЕ название) и quantity.
Если имя клиента (customerName) не названо — спроси его один раз, затем создавай заказ.`;

export async function POST(req: Request) {

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
          send("error", "Empty msgs array");
          return;
        }

        const history = [...messages];
        const lastMessageObj = history.pop();
        const userMessage = lastMessageObj?.parts?.[0]?.text ?? "";

        if (!userMessage.trim()) {
          send("error", "Empty usr msg");
          return;
        }

        const chat = ai.chats.create({
          model: "gemini-2-flash",
          history,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: depotTools }],
          },
        });

        let response = await chat.sendMessage({ message: userMessage });

        const MAX_STEPS = 5;
        for (let step = 0; step < MAX_STEPS; step++) {
          const calls = response.functionCalls ?? [];

          // Модель больше не просит инструментов → это финальный ответ
          if (calls.length === 0) {
            send("text", response.text ?? "");
            break;
          }

          // Выполняем все запрошенные на этом ходу инструменты
          const functionResponses = [];
          for (const call of calls) {
            if (!call.name) continue;
            console.log("🔧 tool call:", call.name);
            send("tool_call", { tool: call.name, args: call.args });

            let toolResult: unknown;
            try {
              toolResult = await executeTool(call.name, call.args);
            } catch (e) {
              // Ошибку инструмента возвращаем модели, а не роняем стрим
              toolResult = { error: e instanceof Error ? e.message : "tool failed" };
            }

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { result: toolResult },
              },
            });
          }

          revalidatePath("/inventory");
          revalidatePath("/orders");

          // Возвращаем результаты модели и идём на следующий виток
          response = await chat.sendMessage({ message: functionResponses });

          if (step === MAX_STEPS - 1) {
            send("text", "Не смог завершить за отведённые шаги, уточни запрос, пожалуйста.");
          }
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