"use client"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

const subscribe = () => () => {}

function getSpeechCtor() {
  if (typeof window === "undefined") return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

export function useSpeech(onResult: (text: string) => void) {
  const supported = useSyncExternalStore(
    subscribe,
    () => getSpeechCtor() !== null, // client
    () => false                     // server
  )

  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

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
    rec.onresult = (e: any) => onResultRef.current(e.results[0][0].transcript)
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