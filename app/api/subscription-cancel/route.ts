import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  const apiUrl = process.env.RULO_API_URL
  const apiKey = process.env.RULO_API_KEY

  if (!apiUrl || !apiKey) {
    return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { user_id } = body as { user_id?: string }

    if (!user_id) {
      return NextResponse.json({ error: "Falta user_id" }, { status: 400 })
    }

    const res = await fetch(`${apiUrl}/subscriptions/cancel`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("[subscription-cancel] Error:", error)
    return NextResponse.json({ error: "Error cancelando suscripción" }, { status: 500 })
  }
}
