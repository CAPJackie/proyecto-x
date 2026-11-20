type RankedTrend = {
  keyword: string;
  score: number;
  normalizedScore: number;
  rank: number;
};

export async function POST(req: Request) {
  const { ranked }: { ranked: RankedTrend[] } = await req.json();

  const classified = ranked.map((item) => ({
    ...item,
    tier: item.normalizedScore >= 70 ? 1 : item.normalizedScore >= 40 ? 2 : 3,
  }));

  return Response.json({ classified });
}
