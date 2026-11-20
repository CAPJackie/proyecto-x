type Trend = { keyword: string; score: number };

const TRENDS_RSS_URL = "https://trends.google.com/trending/rss?geo=CO";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/125.0.0.0 Safari/537.36";

function parseTraffic(raw: string): number {
  const m = raw.trim().match(/^([\d.]+)\s*([KM]?)/i);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  const suffix = m[2].toUpperCase();
  if (suffix === "K") n *= 1_000;
  else if (suffix === "M") n *= 1_000_000;
  return n;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

export async function GET() {
  try {
    const res = await fetch(TRENDS_RSS_URL, {
      cache: "no-store",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Google trends RSS returned ${res.status}`);
    }
    const xml = await res.text();

    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    const trends: Trend[] = [];

    for (const block of itemBlocks.slice(0, 10)) {
      const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
      const trafficMatch = block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/);
      if (!titleMatch) continue;
      const keyword = decodeEntities(titleMatch[1]).trim();
      if (!keyword) continue;
      const score = trafficMatch ? parseTraffic(trafficMatch[1]) : 0;
      trends.push({ keyword, score });
    }

    trends.sort((a, b) => b.score - a.score);
    return Response.json({ trends });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Trends fetch failed: ${message}`, trends: [] }, { status: 503 });
  }
}
