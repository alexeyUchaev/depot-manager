"use client"

import { useState } from "react"
import { MessageCircle, X, Send, Bot } from "lucide-react"

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function AiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)


async function sendMessage() {
  if (!input.trim() || isLoading) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: input,
  }

  setMessages(prev => [...prev, userMessage])
  setInput('')
  setIsLoading(true)

  const assistantId = (Date.now() + 1).toString()
  setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let assistantContent = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6))
              if (json.type === 'text-delta' && json.delta) {
                assistantContent += json.delta
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                )
              }
            } catch {}
          }
        }
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    setIsLoading(false)
  }
}

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors z-50"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col z-50">
          
          <div className="flex items-center gap-2 p-4 border-b">
            <Bot className="h-5 w-5 text-black" />
            <div>
              <p className="text-sm font-semibold">AI Assistant</p>
              <p className="text-xs text-gray-400">Ask about your warehouse</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-xs text-gray-400 text-center mt-8">
                Ask me anything about your inventory or orders
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    m.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-400">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ask about inventory..."
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}
    </>
  )
}