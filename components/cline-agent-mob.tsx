"use client"

import { FaAngleDoubleRight } from "react-icons/fa"
import { useEffect, useRef, useState } from "react"
import { FaMicrophone } from "react-icons/fa"
import { useSpeech } from "@/hooks/use-speech"

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
  const scrollRef = useRef<HTMLDivElement>(null)

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
    if (!text || isLoading) return

    const userMsg: Message = { role: 'user', text }
    const payloadMessages = [...messages, userMsg].map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))

    setMessages((prev) => [...prev, userMsg, { role: 'ai', text: "Thinking..." }])
    setInputText("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      })

      if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => "")
        updateLastMessage(() => `${errText.slice(0, 300)}`)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let isFirstChunk = true

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

          let data: { type: string; content: any }
          try {
            data = JSON.parse(dataStr)
          } catch (parseError) {
            console.error("JSON error:", line, parseError)
            continue
          }

          if (isFirstChunk && (data.type === 'text' || data.type === 'tool_call')) {
            updateLastMessage(() => "")
            isFirstChunk = false
          }

          if (data.type === 'text') {
            updateLastMessage((t) => t + data.content)
          } else if (data.type === 'tool_call') {
            updateLastMessage(() => `⚙️ I'm gonna use ${data.content.tool}...`)
          } else if (data.type === 'error') {
            updateLastMessage(() => `${data.content}`)
          }
        }
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
                : 'bg-white border border-gray-200 text-gray-800 self-start rounded-xl rounded-bl-sm'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="relative bg-white border border-gray-200 rounded-xl shadow-sm w-full h-[100px] focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition">
          <textarea
            className="h-full w-full align-top resize-none outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 px-3 py-2 pr-10 disabled:opacity-60"
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
          {supported && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Voice input"
              className={`absolute right-12 bottom-2 p-2 rounded-lg transition-colors ${
                listening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FaMicrophone className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            <FaAngleDoubleRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}