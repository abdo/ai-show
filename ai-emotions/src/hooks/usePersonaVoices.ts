import { useCallback, useRef, useState } from "react"
import { deepgramApiKey } from "../keys.ignore"

type VoiceStatus = "idle" | "generating" | "ready" | "error"

type PersonaVoice = {
  id: string
  opinion: string
  voiceId: string
}

type VoiceMap = Record<
  string,
  {
    status: VoiceStatus
    audioSrc?: string
    error?: string
  }
>

const deepgramUrl = (voiceId: string) =>
  `https://api.deepgram.com/v1/speak?model=${voiceId}`

export function usePersonaVoices() {
  const [voices, setVoices] = useState<VoiceMap>({})
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)

  const unlockAudio = useCallback(() => {
    unlockedRef.current = true
  }, [])

  const generateVoices = useCallback(async (items: PersonaVoice[]) => {
    if (!items.length) return

    setVoices((prev) => {
      const next = { ...prev }
      items.forEach((item) => {
        next[item.id] = { status: "generating" }
      })
      return next
    })

    await Promise.all(
      items.map(async (item) => {
        try {
          const response = await fetch(deepgramUrl(item.voiceId), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${deepgramApiKey}`,
            },
            body: JSON.stringify({ text: item.opinion }),
          })

          if (!response.ok) {
            const message = await response.text()
            throw new Error(message || "Deepgram error")
          }

          const arrayBuffer = await response.arrayBuffer()
          const audioSrc = arrayBufferToDataUri(arrayBuffer)
          setVoices((prev) => ({
            ...prev,
            [item.id]: { status: "ready", audioSrc },
          }))
        } catch (error) {
          console.error("Voice generation error", error)
          setVoices((prev) => ({
            ...prev,
            [item.id]: {
              status: "error",
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to generate voice",
            },
          }))
        }
      })
    )
  }, [])

  const playVoice = useCallback(
    (id: string) => {
      if (!unlockedRef.current) return
      const voice = voices[id]
      if (!voice || voice.status !== "ready" || !voice.audioSrc) return

      try {
        currentAudioRef.current?.pause()
        const audio = new Audio(voice.audioSrc)
        currentAudioRef.current = audio
        audio.play().catch((err) => {
          console.error("Audio playback error", err)
        })
      } catch (error) {
        console.error("Unable to play voice", error)
      }
    },
    [voices]
  )

  return {
    voiceStatus: voices,
    generateVoices,
    playVoice,
    unlockAudio,
  }
}

const arrayBufferToDataUri = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  const base64 = window.btoa(binary)
  return `data:audio/mp3;base64,${base64}`
}




