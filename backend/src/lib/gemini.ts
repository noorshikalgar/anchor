import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai'
import { z } from 'zod'

const PLAN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    habitRecommendations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          habitId: { type: SchemaType.STRING },
          action: { type: SchemaType.STRING, enum: ['maintain', 'shrink', 'graduate'] },
          reason: { type: SchemaType.STRING },
        },
        required: ['habitId', 'action', 'reason'],
      },
    },
    newHabitSuggestion: {
      type: SchemaType.OBJECT,
      nullable: true,
      properties: {
        habitId: { type: SchemaType.STRING },
        reason: { type: SchemaType.STRING },
      },
      required: ['habitId', 'reason'],
    },
    disruptionPrediction: { type: SchemaType.STRING, nullable: true },
    summary: { type: SchemaType.STRING },
  },
  required: ['habitRecommendations', 'summary'],
}

const PlanOutputSchema = z.object({
  habitRecommendations: z.array(z.object({
    habitId: z.string(),
    action: z.enum(['maintain', 'shrink', 'graduate']),
    reason: z.string(),
  })),
  newHabitSuggestion: z.object({
    habitId: z.string(),
    reason: z.string(),
  }).nullable().optional(),
  disruptionPrediction: z.string().nullable().optional(),
  summary: z.string(),
})

const SYSTEM_PROMPT = `You are Anchor, a calm and practical habit coach. Your job is to look at someone's habit data from the past week and propose a sensible plan for next week.

Rules:
- Be specific and grounded in the data. Do not give generic advice.
- Tone: direct, warm, non-judgmental. No exclamation points.
- If isNew is true OR logsLast7 === 0, the habit was just added or tracking just started. Do NOT penalize. Action must be "maintain". Encourage first attempt.
- If completion rate < 50% AND logsLast7 >= 3, suggest shrinking to fallback version, not removing the habit.
- Only suggest adding a new habit if all focus habits have streak >= 5 days AND slotsUnlocked allows it.
- disruptionPrediction: only include if there is a clear pattern (e.g. same day disrupted 3+ times). Null otherwise.
- recentDailyNotes: user's own words about their days. Use these as primary context — they explain missed habits better than numbers.
- summary: 2-3 sentences max. Plain language. What to focus on, what changed.`

export async function generatePlan(apiKey: string, planInput: unknown, userContext?: string): Promise<z.infer<typeof PlanOutputSchema>> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: PLAN_SCHEMA as Schema,
    },
  })

  const prompt = [
    `Habit data for this week:\n${JSON.stringify(planInput, null, 2)}`,
    userContext ? `User context: ${userContext}` : null,
    'Generate the weekly plan.',
  ].filter(Boolean).join('\n\n')

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)
  return PlanOutputSchema.parse(parsed)
}
