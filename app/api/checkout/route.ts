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

    const text = await res.text()
    let data: Record<string, unknown> = {}
    if (text.length > 0) {
      try {
        data = JSON.parse(text) as Record<string, unknown>
      } catch {
        console.error("[checkout] Non-JSON response from rulo-api:", res.status, text.slice(0, 500))
        return NextResponse.json(
          { error: `Respuesta inválida del backend (status ${res.status})` },
          { status: 502 },
        )
      }
    }

    if (!res.ok || !data.success) {
      const errorText =
        typeof data.error === "string"
          ? data.error
          : typeof data.mp_message === "string"
            ? data.mp_message
            : "Error al crear suscripción"
      console.error("[checkout] rulo-api error:", res.status, JSON.stringify(data))
      return NextResponse.json(
        { error: errorText, details: data },
        { status: res.status },
      )
    }

    const result = data.result as { init_point?: string } | undefined
    if (!result?.init_point) {
      return NextResponse.json(
        { error: "El backend no devolvió init_point" },
        { status: 502 },
      )
    }

    return NextResponse.json({ init_point: result.init_point })
  } catch (error) {
    console.error("[checkout] Error:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
