"use client"

import { useState } from "react"
import { Loader2, TrendingUp, BarChart2, Layers, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Trend = { keyword: string; score: number }
type RankedTrend = Trend & { normalizedScore: number; rank: number }
type ClassifiedTrend = RankedTrend & {
  tier: 1 | 2 | 3
  product?: string
  generating?: boolean
}

const TIER_COLORS: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-800 border-emerald-200",
  2: "bg-amber-100 text-amber-800 border-amber-200",
  3: "bg-zinc-100 text-zinc-700 border-zinc-200",
}

const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 — Alto potencial",
  2: "Tier 2 — Potencial medio",
  3: "Tier 3 — Potencial bajo",
}

export default function Home() {
  const [rawTrends, setRawTrends] = useState<Trend[]>([])
  const [rankedTrends, setRankedTrends] = useState<RankedTrend[]>([])
  const [classified, setClassified] = useState<ClassifiedTrend[]>([])

  const [step1Loading, setStep1Loading] = useState(false)
  const [step2Loading, setStep2Loading] = useState(false)
  const [step3Loading, setStep3Loading] = useState(false)

  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [step2Error, setStep2Error] = useState<string | null>(null)
  const [step3Error, setStep3Error] = useState<string | null>(null)

  async function extractTrends() {
    setStep1Loading(true)
    setStep1Error(null)
    setRawTrends([])
    setRankedTrends([])
    setClassified([])

    try {
      const res = await fetch("/api/trends")
      const data = await res.json()
      console.log(data);
      if (data.error) throw new Error(data.error)
      setRawTrends(data.trends)
    } catch (err) {
      setStep1Error(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setStep1Loading(false)
    }
  }

  async function rankTrends() {
    setStep2Loading(true)
    setStep2Error(null)
    setRankedTrends([])
    setClassified([])

    try {
      const res = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trends: rawTrends }),
      })
      const data = await res.json()
      setRankedTrends(data.ranked)
    } catch (err) {
      setStep2Error(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setStep2Loading(false)
    }
  }

  async function classifyTrends() {
    setStep3Loading(true)
    setStep3Error(null)
    setClassified([])

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranked: rankedTrends }),
      })
      const data = await res.json()
      setClassified(data.classified)
    } catch (err) {
      setStep3Error(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setStep3Loading(false)
    }
  }

  async function generateProduct(keyword: string, tier: 1 | 2 | 3) {
    setClassified((prev) =>
      prev.map((t) => (t.keyword === keyword ? { ...t, generating: true, product: undefined } : t))
    )

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, tier }),
      })
      const data = await res.json()
      setClassified((prev) =>
        prev.map((t) =>
          t.keyword === keyword ? { ...t, generating: false, product: data.product } : t
        )
      )
    } catch {
      setClassified((prev) =>
        prev.map((t) =>
          t.keyword === keyword ? { ...t, generating: false } : t
        )
      )
    }
  }

  const tierGroups = [1, 2, 3].map((tier) => ({
    tier: tier as 1 | 2 | 3,
    trends: classified.filter((t) => t.tier === tier),
  }))

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Content Factory
        </h1>
        <p className="mt-1 text-zinc-500 text-sm">
          Trend Scanner → Scoring → Clasificación → Producto
        </p>
      </div>

      {/* Pipeline controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-700">
            Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {/* Step 1 */}
          <div className="flex flex-col gap-1 flex-1 min-w-48">
            <Button
              onClick={extractTrends}
              disabled={step1Loading}
              className="gap-2"
            >
              {step1Loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Extract info Google Trends
            </Button>
            {rawTrends.length > 0 && (
              <p className="text-xs text-emerald-600 font-medium pl-1">
                ✓ {rawTrends.length} tendencias extraídas
              </p>
            )}
            {step1Error && (
              <p className="text-xs text-red-600 pl-1">{step1Error}</p>
            )}
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-1 flex-1 min-w-48">
            <Button
              onClick={rankTrends}
              disabled={rawTrends.length === 0 || step2Loading}
              variant="outline"
              className="gap-2"
            >
              {step2Loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart2 className="h-4 w-4" />
              )}
              Rankear por potencial
            </Button>
            {rankedTrends.length > 0 && (
              <p className="text-xs text-emerald-600 font-medium pl-1">
                ✓ {rankedTrends.length} tendencias rankeadas
              </p>
            )}
            {step2Error && (
              <p className="text-xs text-red-600 pl-1">{step2Error}</p>
            )}
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-1 flex-1 min-w-48">
            <Button
              onClick={classifyTrends}
              disabled={rankedTrends.length === 0 || step3Loading}
              variant="outline"
              className="gap-2"
            >
              {step3Loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Layers className="h-4 w-4" />
              )}
              Clasifica Tier 1/2/3
            </Button>
            {classified.length > 0 && (
              <p className="text-xs text-emerald-600 font-medium pl-1">
                ✓ Clasificadas en 3 tiers
              </p>
            )}
            {step3Error && (
              <p className="text-xs text-red-600 pl-1">{step3Error}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tier results */}
      {classified.length > 0 &&
        tierGroups.map(({ tier, trends }) =>
          trends.length === 0 ? null : (
            <section key={tier} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
                {TIER_LABELS[tier]}
              </h2>
              <div className="space-y-3">
                {trends.map((trend) => (
                  <Card key={trend.keyword} className="overflow-hidden">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-zinc-400 font-mono w-5 text-right">
                          #{trend.rank}
                        </span>
                        <Badge
                          className={`text-xs border ${TIER_COLORS[tier]}`}
                          variant="outline"
                        >
                          T{tier}
                        </Badge>
                        <span className="font-medium text-zinc-900 flex-1">
                          {trend.keyword}
                        </span>
                        <span className="text-xs text-zinc-400 tabular-nums">
                          score {trend.normalizedScore}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={trend.generating}
                          onClick={() => generateProduct(trend.keyword, tier)}
                          className="gap-1.5 text-xs"
                        >
                          {trend.generating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Genera Producto
                        </Button>
                      </div>

                      {trend.product && (
                        <div className="mt-3 ml-8 rounded-md bg-zinc-50 border border-zinc-200 p-3">
                          <p className="text-sm text-zinc-700 leading-relaxed">
                            {trend.product}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )
        )}
    </main>
  )
}
