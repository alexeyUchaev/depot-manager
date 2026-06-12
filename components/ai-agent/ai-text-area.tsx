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
    <div className="p-3 border-t border-sidebar-border">
      {/* dashboard-style rounded input */}
      <div className="relative bg-card border border-gray-200 rounded-xl shadow-sm w-full h-[100px] focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition">
        <textarea
          className="h-full w-full align-top resize-none outline-none bg-transparent text-sm 	text-foreground placeholder:text-muted-foreground px-3 py-2 pr-10 disabled:opacity-60"
          placeholder="Type a message..."
          value={value}
          onChange={onChange}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button
          onClick={onSend}
          disabled={disabled}
          className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send"
        >
          <FaAngleDoubleRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}