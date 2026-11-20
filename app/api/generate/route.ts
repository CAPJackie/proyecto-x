import Groq from "groq-sdk";

const groq = new Groq();

export async function POST(req: Request) {
  const { keyword, tier }: { keyword: string; tier: 1 | 2 | 3 } = await req.json();

  const tierContext =
    tier === 1
      ? "This is a high-potential Tier 1 trend. Propose an automated, scalable digital product."
      : tier === 2
        ? "This is a moderate Tier 2 trend. Propose a focused digital product requiring moderate effort."
        : "This is a lower-potential Tier 3 trend. Propose a quick, minimal-effort digital product.";

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are a digital product strategist. Given the trending topic "${keyword}", generate exactly one paragraph describing a micro-product idea (eBook, template, printable, or checklist). ${tierContext} Include: product title, format, target audience, and key value proposition. Keep it under 100 words. No bullet points, just one paragraph.`,
      },
    ],
  });

  const product = completion.choices[0]?.message?.content ?? "";
  return Response.json({ keyword, tier, product });
}
