"use client"

import { FaAngleDoubleRight, FaPaperclip, FaTimes } from "react-icons/fa"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FaMicrophone } from "react-icons/fa"
import { useSpeech } from "@/hooks/use-speech"
import { MessageText } from "@/components/ai-agent/message-text"
import { type ChatAttachment } from "@/components/ai-agent/ai-text-area"

type Message = { role: 'user' | 'ai'; text: string }

interface MobAIProps {
  isOpen: boolean
}

export default function MobAI({ isOpen }: MobAIProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const { listening, supported, toggle } = useSpeech((text) =>
  setInputText((prev) => (prev ? prev + " " : "") + text))
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleAttach = async (files: FileList) => {
    const picked = Array.from(files)
    const startIndex = attachments.length
    setAttachments((prev) => [
      ...prev,
      ...picked.map((f) => ({ filename: f.name, mimeType: f.type, uploading: true })),
    ])

    await Promise.all(
      picked.map(async (file, i) => {
        const index = startIndex + i
        try {
          const form = new FormData()
          form.append("file", file)
          const res = await fetch("/api/chat/attachments", { method: "POST", body: form })
          const json = await res.json()
          setAttachments((prev) => {
            const next = [...prev]
            if (!next[index]) return prev
            next[index] = res.ok
              ? { ...next[index], id: json.id, uploading: false }
              : { ...next[index], uploading: false, error: json.error || "Upload failed" }
            return next
          })
        } catch {
          setAttachments((prev) => {
            const next = [...prev]
            if (next[index]) next[index] = { ...next[index], uploading: false, error: "Upload failed" }
            return next
          })
        }
      })
    )
  }

  const removeAttachment = (index: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index))

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const updateLastMessage = (updater: (text: string) => string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev
      const updated = [...prev]
      const last = updated[updated.length - 1]
      updated[updated.length - 1] = { ...last, text: updater(last.text) }
      return updated
    })
  }

  const handleSendMessage = async () => {
    const text = inputText.trim()
    const ready = attachments.filter((a) => a.id && !a.error)
    if ((!text && ready.length === 0) || isLoading) return
    if (attachments.some((a) => a.uploading)) return

    const attachmentNote = ready.length ? `📎 ${ready.map((a) => a.filename).join(', ')}` : ''
    const displayText = [text, attachmentNote].filter(Boolean).join('\n')

    const userMsg: Message = { role: 'user', text: displayText }
    const payloadMessages = [...messages, { role: 'user' as const, text }].map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))

    setMessages((prev) => [...prev, userMsg, { role: 'ai', text: "Thinking..." }])
    setInputText("")
    setAttachments([])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          attachments: ready.map((a) => ({ id: a.id })),
        }),
      })

      if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => "")
        updateLastMessage(() => `${errText.slice(0, 300)}`)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      let answer = ""
      let toolStatus = ""
      let paymentLink = ""
      let usedTool = false
      const compose = () => {
        const lines: string[] = []
        if (answer) lines.push(answer)
        else if (toolStatus) lines.push(toolStatus)
        if (paymentLink && !answer.includes(paymentLink)) {
          lines.push(`💳 Payment link: ${paymentLink}`)
        }
        return lines.join("\n\n")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const dataStr = line.slice(6).trim()
          if (dataStr === '[DONE]') continue

          let data: { type: 'text'; content: string } | { type: 'tool_call'; content: { tool?: string } } | { type: 'payment_link'; content: { url: string } } | { type: 'error'; content: string }
          try {
            data = JSON.parse(dataStr)
          } catch (parseError) {
            console.error("JSON error:", line, parseError)
            continue
          }

          if (data.type === 'text') {
            answer += data.content
            updateLastMessage(compose)
          } else if (data.type === 'tool_call') {
            usedTool = true
            toolStatus = `⚙️ I'm gonna use ${data.content.tool}...`
            updateLastMessage(compose)
          } else if (data.type === 'payment_link') {
            paymentLink = data.content.url
            updateLastMessage(compose)
          } else if (data.type === 'error') {
            updateLastMessage(() => `${data.content}`)
          }
        }
      }

      if (usedTool) {
        router.refresh()
      }
    } catch (e) {
      console.error("Error:", e)
      updateLastMessage(() => "Try again...")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`fixed md:hidden py-10 top-0 z-30 flex flex-col h-dvh w-full bg-sidebar text-sidebar-foreground transition-[left] duration-200 ${
        isOpen ? 'left-0' : 'left-[-9999px]'
      }`}
    >
      <div className="px-4 py-2 text-lg font-black border-b border-sidebar-border">
        Depot-AI-Agent
      </div>
        {messages.length === 0 && (
            <div className="text-xs text-gray-600 text-center mt-6">
              Ask anything about your inventory…
            </div>
        )}  
      <div className="grow min-h-0 flex flex-col gap-2 px-3 py-3 overflow-y-auto" ref={scrollRef}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[95%] px-3 py-2 text-sm whitespace-pre-wrap break-words shadow-sm ${
              m.role === 'user'
                ? 'bg-black text-white self-end rounded-xl rounded-br-sm'
                : 'bg-card border text-card-foregroundself-start rounded-xl rounded-bl-sm'
            }`}
          >
            <MessageText text={m.text} />
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-sidebar-border">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map((a, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 max-w-full rounded-md border px-2 py-1 text-xs ${
                  a.error ? 'border-red-400 text-red-600' : 'border-gray-200 bg-card text-foreground'
                }`}
                title={a.error || a.filename}
              >
                <FaPaperclip className="h-2.5 w-2.5 shrink-0 opacity-60" />
                <span className="truncate">{a.filename}</span>
                {a.uploading && <span className="opacity-60">…</span>}
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  aria-label="Remove attachment"
                  className="shrink-0 opacity-60 hover:opacity-100"
                >
                  <FaTimes className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleAttach(e.target.files)
            e.target.value = ""
          }}
        />
        <div className="relative bg-card border rounded-xl shadow-sm w-full h-[100px] focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition">
          <textarea
            className="h-full w-full align-top resize-none outline-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground pl-10 pr-10 py-2 disabled:opacity-60"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="Attach document"
            className="absolute left-2 bottom-2 p-2 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <FaPaperclip className="h-3 w-3" />
          </button>
          {supported && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Voice input"
              className={`absolute right-12 bottom-2 p-2 rounded-lg transition-colors ${
                listening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <FaMicrophone className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            <FaAngleDoubleRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}