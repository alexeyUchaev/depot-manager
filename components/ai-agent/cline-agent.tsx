'use client';
import { CgToggleSquare, CgToggleSquareOff } from "react-icons/cg";
import { useEffect, useRef, useState } from "react";
import AiTextArea from "./ai-text-area";

type Message = { role: 'user' | 'ai'; text: string };

export function ClineAgent() {
  const [toggle, setToggle] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const updateLastMessage = (updater: (text: string) => string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = updated[updated.length - 1];
      updated[updated.length - 1] = { ...last, text: updater(last.text) };
      return updated;
    });
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', text };
    const payloadMessages = [...messages, userMsg].map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    setMessages((prev) => [...prev, userMsg, { role: 'ai', text: "Thinking..." }]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => "");
        updateLastMessage(() => `${errText.slice(0, 300)}`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;

          let data: { type: string; content: any };
          try {
            data = JSON.parse(dataStr);
          } catch (parseError) {
            console.error("JSON Error:", line, parseError);
            continue;
          }

          if (isFirstChunk && (data.type === 'text' || data.type === 'tool_call')) {
            updateLastMessage(() => "");
            isFirstChunk = false;
          }

          if (data.type === 'text') {
            updateLastMessage((t) => t + data.content);
          } else if (data.type === 'tool_call') {
          updateLastMessage(() => `⚙️ Using ${data.content.tool || 'a tool'}...`);
          } else if (data.type === 'error') {
            updateLastMessage(() => `${data.content}`);
          }
        }
      }
    } catch (e) {
      console.error("Error:", e);
      updateLastMessage(() => "Try again...");
    } finally {
      setIsLoading(false);
    }
  };

    return (
      <div className="hidden md:block">
        <button
          onClick={() => setToggle((p) => !p)}
          aria-label="Toggle AI agent"
          className="fixed top-2 right-2 z-50 p-1.5 rounded-md bg-sidebar border border-sidebar-border text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {toggle ? <CgToggleSquare className="h-5 w-5" /> : <CgToggleSquareOff className="h-5 w-5" />}
        </button>
        {toggle && (
          <div className="relative flex h-dvh w-[280px] flex-col">
            <div className="fixed flex h-dvh w-[280px] flex-col bg-sidebar text-sidebar-foreground border-l border-sidebar-border">
              <div className="px-4 py-3 text-md font-black border-b ">
                Depot-AI-Agent
              </div>
              <div className="grow min-h-0 flex flex-col gap-2 px-3 py-3 overflow-y-auto bg-background" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center mt-6">
                    Ask anything about your inventory…
                  </div>
                )}                
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] px-3 py-2 text-sm whitespace-pre-wrap wrap-break-word shadow-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground self-end rounded-xl rounded-br-sm'
                        : '	bg-card border text-card-foreground self-start rounded-xl rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <AiTextArea value={inputText} onChange={(e) => setInputText(e.target.value)} onSend={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        )}
      </div>
  );
}