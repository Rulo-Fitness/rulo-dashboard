import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const apiUrl = process.env.RULO_API_URL
  const apiKey = process.env.RULO_API_KEY

  if (!apiUrl || !apiKey) {
    return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")

  if (!userId) {
    return NextResponse.json({ error: "Falta user_id" }, { status: 400 })
  }

  try {
    const res = await fetch(`${apiUrl}/subscriptions/status?user_id=${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("[subscription-status] Error:", error)
    return NextResponse.json({ error: "Error consultando estado" }, { status: 500 })
  }
}
