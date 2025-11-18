import { useCallback, useState } from "react"
import axios from "axios"
import { groqApiKey } from "../keys.ignore"

export type PersonaPerspective = {
  id: string
  image: string
  title: string
  subtitle: string
  handle: string
  borderColor: string
  gradient: string
  opinion: string
  voiceId: string
  url: string
}

type PerspectivesState = {
  personas: PersonaPerspective[]
  isLoading: boolean
  error: string | null
}

const voicePool = [
  "aura-2-athena-en",
  "aura-2-thalia-en",
  "aura-2-orion-en",
  "aura-2-luna-en",
  "aura-2-zeus-en",
  "aura-2-sol-en",
]

const demoPersonas: PersonaPerspective[] = [
  {
    id: "alex-rivera",
    image: "https://i.pravatar.cc/300?img=8",
    title: "Alex Rivera",
    subtitle: "Full Stack Developer",
    handle: "@alexrivera",
    borderColor: "#4F46E5",
    gradient: "linear-gradient(145deg, #4F46E5, #000)",
    opinion:
      "You reacted with empathy, which most teammates appreciate. Still, a quick follow-up to align expectations could keep trust high.",
    voiceId: voicePool[0],
    url: "https://github.com/",
  },
  {
    id: "jordan-chen",
    image: "https://i.pravatar.cc/300?img=11",
    title: "Jordan Chen",
    subtitle: "DevOps Engineer",
    handle: "@jordanchen",
    borderColor: "#10B981",
    gradient: "linear-gradient(210deg, #10B981, #000)",
    opinion:
      "From my perspective you protected the deadline, but looping the team in sooner could have avoided the scramble.",
    voiceId: voicePool[1],
    url: "https://linkedin.com/in/",
  },
  {
    id: "morgan-blake",
    image: "https://i.pravatar.cc/300?img=3",
    title: "Morgan Blake",
    subtitle: "UI/UX Designer",
    handle: "@morganblake",
    borderColor: "#F59E0B",
    gradient: "linear-gradient(165deg, #F59E0B, #000)",
    opinion:
      "It sounds like you took on the emotional labor for everyone. Setting gentle boundaries might help you feel less drained next time.",
    voiceId: voicePool[2],
    url: "https://dribbble.com/",
  },
  {
    id: "casey-park",
    image: "https://i.pravatar.cc/300?img=16",
    title: "Casey Park",
    subtitle: "Data Scientist",
    handle: "@caseypark",
    borderColor: "#EF4444",
    gradient: "linear-gradient(195deg, #EF4444, #000)",
    opinion:
      "If the facts were unclear you might have escalated too soon. Double-checking data before sounding the alarm can protect your credibility.",
    voiceId: voicePool[3],
    url: "https://kaggle.com/",
  },
  {
    id: "sam-kim",
    image: "https://i.pravatar.cc/300?img=25",
    title: "Sam Kim",
    subtitle: "Mobile Developer",
    handle: "@thesamkim",
    borderColor: "#8B5CF6",
    gradient: "linear-gradient(225deg, #8B5CF6, #000)",
    opinion:
      "This was a tough call, but prioritizing the user experience shows integrity. Just make sure leadership knows the trade-off you made.",
    voiceId: voicePool[4],
    url: "https://github.com/",
  },
  {
    id: "tyler-rodriguez",
    image: "https://i.pravatar.cc/300?img=60",
    title: "Tyler Rodriguez",
    subtitle: "Cloud Architect",
    handle: "@tylerrod",
    borderColor: "#06B6D4",
    gradient: "linear-gradient(135deg, #06B6D4, #000)",
    opinion:
      "I'd be cautious: skipping the rollout checklist can introduce hidden risk. Maybe schedule a retrospective to tighten the process.",
    voiceId: voicePool[5],
    url: "https://aws.amazon.com/",
  },
]

const systemPrompt = `You are a council of thoughtful professionals helping a user examine a situation from multiple angles. Return ONLY JSON matching this schema:
{
  "personas": [
    {
      "id": "kebab-case-identifier",
      "image": "https://i.pravatar.cc/300?img=NUMBER",
      "title": "Persona name",
      "subtitle": "Role or background",
      "handle": "@handle",
      "borderColor": "#HEX",
      "gradient": "linear-gradient(...)",
      "opinion": "Two or three sentences that respond realistically to the user's situation",
      "voiceId": "one of aura-2-athena-en,aura-2-thalia-en,aura-2-orion-en,aura-2-luna-en,aura-2-zeus-en,aura-2-sol-en",
      "url": "https://"
    }
  ]
}
Guidelines:
- Provide 4 to 6 personas.
- Mix perspectives: some supportive, some challenging, some neutral.
- Keep tone human and grounded in the user's situation.
- Use different gradients and border colors for variety.
- Handles should be realistic.
- Do NOT include extra text outside JSON.`

const extractJson = (raw: string) => {
  const cleaned = raw.replace(/```json|```/g, "").trim()
  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start === -1 || end === -1) {
    throw new Error("No JSON found in response")
  }
  return cleaned.slice(start, end + 1)
}

export function usePerspectives() {
  const [state, setState] = useState<PerspectivesState>({
    personas: demoPersonas,
    isLoading: false,
    error: null,
  })

  const fetchPerspectives = useCallback(async (scenario: string) => {
    if (!scenario.trim()) return

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          temperature: 0.8,
          top_p: 1,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `The user shared this situation: "${scenario.trim()}". Craft the personas.`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
        }
      )

      const answer = response.data?.choices?.[0]?.message?.content ?? ""
      const jsonString = extractJson(answer)
      const parsed = JSON.parse(jsonString) as { personas?: PersonaPerspective[] }

      if (!parsed.personas || !Array.isArray(parsed.personas) || parsed.personas.length === 0) {
        throw new Error("No personas returned")
      }

      const personas = parsed.personas.slice(0, 6).map((persona, index) => ({
        ...persona,
        id: persona.id || `persona-${index}`,
        voiceId: persona.voiceId || voicePool[index % voicePool.length],
        image: persona.image || `https://i.pravatar.cc/300?img=${(index + 7) * 3}`,
        borderColor: persona.borderColor || "#4F46E5",
        gradient: persona.gradient || "linear-gradient(145deg, #4F46E5, #000)",
        url: persona.url || "https://example.com",
      }))

      setState({ personas, isLoading: false, error: null })
    } catch (error) {
      console.error("usePerspectives error", error)
      setState({
        personas: demoPersonas,
        isLoading: false,
        error: "Couldn't fetch fresh perspectives. Showing a demo set instead.",
      })
    }
  }, [])

  return {
    ...state,
    fetchPerspectives,
  }
}




