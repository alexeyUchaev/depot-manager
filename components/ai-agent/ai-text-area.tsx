"use client";
import { useRef } from "react";
import { FaAngleDoubleRight, FaPaperclip, FaTimes } from "react-icons/fa";

export type ChatAttachment = {
  id?: string;
  filename: string;
  mimeType: string;
  uploading?: boolean;
  error?: string;
};

export default function AiTextArea({
  value, onChange, onSend, disabled = false,
  attachments = [], onAttach, onRemoveAttachment,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  disabled?: boolean;
  attachments?: ChatAttachment[];
  onAttach?: (files: FileList) => void;
  onRemoveAttachment?: (index: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-3 border-t border-sidebar-border">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((a, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 max-w-full rounded-md border px-2 py-1 text-xs ${
                a.error
                  ? 'border-red-400 text-red-600'
                  : 'border-gray-200 bg-card text-foreground'
              }`}
              title={a.error || a.filename}
            >
              <FaPaperclip className="h-2.5 w-2.5 shrink-0 opacity-60" />
              <span className="truncate">{a.filename}</span>
              {a.uploading && <span className="opacity-60">…</span>}
              <button
                type="button"
                onClick={() => onRemoveAttachment?.(i)}
                aria-label="Remove attachment"
                className="shrink-0 opacity-60 hover:opacity-100"
              >
                <FaTimes className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
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
        {onAttach && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) onAttach(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="absolute left-2 bottom-2 p-2 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              aria-label="Attach document"
            >
              <FaPaperclip className="h-3 w-3" />
            </button>
          </>
        )}
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
