import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const apiUrl = process.env.RULO_API_URL
  const apiKey = process.env.RULO_API_KEY

  if (!apiUrl || !apiKey) {
    return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { user_id, plan, payer_email } = body as { user_id?: string; plan?: string; payer_email?: string }

    if (!user_id || !plan) {
      return NextResponse.json({ error: "Faltan user_id o plan" }, { status: 400 })
    }

    const backUrl = process.env.MERCADOPAGO_CALLBACK_URL ?? "http://localhost:3000"

    const res = await fetch(`${apiUrl}/subscriptions/checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id, plan, payer_email, back_url: backUrl }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { error: data.error ?? "Error al crear suscripción" },
        { status: res.status },
      )
    }

    return NextResponse.json({ init_point: data.result.init_point })
  } catch (error) {
    console.error("[checkout] Error:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
