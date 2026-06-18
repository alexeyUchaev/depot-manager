"use client"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

const subscribe = () => () => {}

interface SpeechRecognitionEventLike {
  results: { [i: number]: { [j: number]: { transcript: string } } }
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function useSpeech(onResult: (text: string) => void) {
  const supported = useSyncExternalStore(
    subscribe,
    () => getSpeechCtor() !== null, // client
    () => false                     // server
  )

  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognitionLike | null>(null)

  // keep the latest callback without recreating the recognizer
  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    const SR = getSpeechCtor()
    if (!SR) return
    const rec = new SR()
    rec.lang = "en-US"
    rec.interimResults = false
    rec.continuous = false
    rec.onresult = (e: SpeechRecognitionEventLike) => onResultRef.current(e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec

    return () => {
      rec.onresult = null
      rec.onend = null
      rec.onerror = null
      try { rec.abort() } catch {}
      recRef.current = null
    }
  }, [])

  const toggle = () => {
    const rec = recRef.current
    if (!rec) return
    try {
      if (listening) {
        rec.stop()
        setListening(false)
      } else {
        rec.start()
        setListening(true)
      }
    } catch {
      setListening(false)
    }
  }

  return { listening, supported, toggle }
}