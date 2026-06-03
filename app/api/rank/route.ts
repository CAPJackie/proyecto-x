type Trend = { keyword: string; score: number }

export async function POST(req: Request) {
  const { trends }: { trends: Trend[] } = await req.json()

  if (!trends?.length) {
    return Response.json({ ranked: [] })
  }

  const scores = trends.map((t) => t.score)
  const max = Math.max(...scores)
  const min = Math.min(...scores)
  const range = max - min || 1

  const ranked = trends
    .map((t) => ({
      ...t,
      normalizedScore: Math.round(((t.score - min) / range) * 100),
    }))
    .sort((a, b) => b.normalizedScore - a.normalizedScore)
    .map((t, i) => ({ ...t, rank: i + 1 }))

  return Response.json({ ranked })
}
