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

    setMessages((prev) => [...prev, userMsg, { role: 'ai', text: "Думаю..." }]);
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
        updateLastMessage(() => `❌ Сервер вернул ${response.status}. ${errText.slice(0, 300)}`);
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
            console.error("Ошибка парсинга JSON:", line, parseError);
            continue;
          }

          if (isFirstChunk && (data.type === 'text' || data.type === 'tool_call')) {
            updateLastMessage(() => "");
            isFirstChunk = false;
          }

          if (data.type === 'text') {
            updateLastMessage((t) => t + data.content);
          } else if (data.type === 'tool_call') {
            updateLastMessage(() => `⚙️ Вызываю инструмент: ${data.content.tool}...`);
          } else if (data.type === 'error') {
            updateLastMessage(() => `❌ Ошибка: ${data.content}`);
          }
        }
      }
    } catch (e) {
      console.error("Ошибка стрима:", e);
      updateLastMessage(() => "❌ Не удалось связаться с сервером.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hidden md:block">
      <div>
        <button className="p-3 top-0 relative flex justify-start" onClick={() => setToggle((p) => !p)}>
          {toggle ? <CgToggleSquare /> : <CgToggleSquareOff />}
        </button>
      </div>
      <div className={`relative flex h-dvh w-[300px] flex-col bg-[#9c9c9025] border-l border-[#00000024] text-sidebar-foreground ${toggle ? 'right-0' : 'hidden'}`}>
        <div className="py-2.5 text-xl font-black text-[#423737] text-center border-b border-[#00000024]">
          Depot-AI-Agent
        </div>
        <div className="grow min-h-0 flex flex-col gap-2 p-1 md:p-2 bg-[#ffffffde] overflow-y-auto" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] p-1 md:p-2 rounded whitespace-pre-wrap wrap-break-word ${m.role === 'user' ? 'bg-blue-100 self-end' : 'bg-white border self-start'}`}>
              {m.text}
            </div>
          ))}
        </div>
        <AiTextArea value={inputText} onChange={(e) => setInputText(e.target.value)} onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}