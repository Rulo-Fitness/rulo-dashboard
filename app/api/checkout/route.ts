import { proxyPost } from "@/lib/api-proxy"

export async function POST(request: Request) {
  const body = await request.json()
  const back_url = process.env.MERCADOPAGO_CALLBACK_URL ?? "https://rulo-dashboard.vercel.app"

  const enriched = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ ...body, back_url }),
  })

  return proxyPost("/subscriptions/checkout", enriched)
}
