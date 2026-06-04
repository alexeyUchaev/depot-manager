// ai-text-area.tsx
"use client";
import { FaAngleDoubleRight } from "react-icons/fa";

export default function AiTextArea({
  value, onChange, onSend, disabled = false,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="py-2.5 px-2 text-[#423737] border-t border-[#00000024]">
      <div className="relative p-0.5 border rounded-xs border-[#00000024] w-full h-[100px]">
        <textarea
          className="h-full w-full align-top resize-none outline-none pr-8 pt-1 pl-2 disabled:opacity-60"
          placeholder="Type a message..."
          value={value}
          onChange={onChange}
          disabled={disabled}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        />
        <div className="absolute right-2 bottom-2 rounded-sm text-[#423737] opacity-80 hover:opacity-100 transition-opacity bg-[#b8b8b833]">
          <button onClick={onSend} disabled={disabled} className="p-1 flex justify-around disabled:opacity-40 disabled:cursor-not-allowed">
            <FaAngleDoubleRight />
          </button>
        </div>
      </div>
    </div>
  );
}