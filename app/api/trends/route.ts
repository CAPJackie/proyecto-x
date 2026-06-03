export async function GET() {
  const pythonUrl = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000"

  try {
    const res = await fetch(`${pythonUrl}/trends`, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    })
    console.log(`${pythonUrl}/trends`);
    if (!res.ok) throw new Error(`Python service returned ${res.status}`)
    const data = await res.json();
    console.log(data);
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json(
      { error: `Python service unavailable: ${message}`, trends: [] },
      { status: 503 }
    )
  }
}
