import { GoogleGenAI } from "@google/genai";
import { revalidatePath } from "next/cache";
import { depotTools } from "@/lib/ai-tools";
import { executeTool } from "@/lib/ai-executor";

export const runtime = "nodejs"; // node runtime is required for executeTool/revalidatePath

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

* Keep track of the context to guide the user smoothly through warehouse operations.
### Creating orders:
When the user names products for an order (even loosely or with typos):
1. IMMEDIATELY call getAllProductsByTenant — don't ask for permission, just do it.
2. Match the user's words to products by brand/type, ignoring filler words. Example: "samsung monitor" → "Samsung 27\" 4K Monitor".
3. On an UNAMBIGUOUS match, use the product right away — do NOT ask again.
4. Ask again ONLY if the product isn't found or several options match (e.g. two "Premium Laptop"s).
5. Then immediately call createOrder, passing the SKU (NOT the name) and quantity.
If the customer name (customerName) wasn't provided, ask for it once, then create the order.`;

/** Pull a Stripe checkout URL out of a tool result, whatever its shape. */
function extractCheckoutUrl(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const data = (result as { data?: unknown }).data;
  if (data && typeof data === "object") {
    const url = (data as { url?: unknown; checkoutUrl?: unknown }).url ??
      (data as { checkoutUrl?: unknown }).checkoutUrl;
    if (typeof url === "string" && url) return url;
  }
  return null;
}

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
          send("error", "GEMINI_API_KEY is not set in .env.local (a server restart is required)");
          return;
        }

        const { messages } = await req.json();
        console.log("📨 messages:", messages?.length);

        if (!Array.isArray(messages) || messages.length === 0) {
          send("error", "Messages array is empty");
          return;
        }

        const history = [...messages];
        const lastMessageObj = history.pop();
        const userMessage = lastMessageObj?.parts?.[0]?.text ?? "";

        if (!userMessage.trim()) {
          send("error", "User message is empty");
          return;
        }

        const chat = ai.chats.create({
          model: "gemini-2.5-flash",
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

          // The model no longer requests tools → this is the final answer
          if (calls.length === 0) {
            send("text", response.text ?? "");
            break;
          }

          // Execute every tool requested on this turn
          const functionResponses = [];
          for (const call of calls) {
            if (!call.name) continue;
            console.log("🔧 tool call:", call.name);
            send("tool_call", { tool: call.name, args: call.args });

            let toolResult: unknown;
            try {
              toolResult = await executeTool(call.name, call.args);
            } catch (e) {
              // Return the tool error to the model instead of killing the stream
              toolResult = { error: e instanceof Error ? e.message : "tool failed" };
            }

            // Surface any Stripe payment link directly to the chat so it always
            // reaches the user, even if the model's text answer omits the URL.
            const checkoutUrl = extractCheckoutUrl(toolResult);
            if (checkoutUrl) {
              send("payment_link", { url: checkoutUrl });
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

          // Send the results back to the model and continue to the next iteration
          response = await chat.sendMessage({ message: functionResponses });

          if (step === MAX_STEPS - 1) {
            send("text", "I couldn't finish within the allotted steps — please refine your request.");
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