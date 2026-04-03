import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  const apiUrl = process.env.RULO_API_URL
  const apiKey = process.env.RULO_API_KEY

  if (!accessToken || !apiUrl || !apiKey) {
    return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const paymentId = String(body?.payment_id ?? "")

    if (!paymentId) {
      return NextResponse.json({ error: "Falta payment_id" }, { status: 400 })
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const payment = await mpRes.json()

    if (!mpRes.ok) {
      return NextResponse.json({ error: "No se pudo consultar el pago" }, { status: 400 })
    }

    if (payment.status !== "approved" || !payment.external_reference) {
      return NextResponse.json({ error: "El pago todavía no está aprobado" }, { status: 409 })
    }

    const ref = JSON.parse(payment.external_reference) as { user_id: string; plan: string }
    const persistRes = await fetch(`${apiUrl}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: ref.user_id,
        mp_payment_id: String(payment.id),
        plan: ref.plan,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        status: "approved",
      }),
    })

    const persistData = await persistRes.json()

    if (!persistRes.ok || !persistData.success) {
      return NextResponse.json({ error: "No se pudo persistir el pago" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      result: persistData.result,
    })
  } catch (error) {
    console.error("[payments-confirm] Error:", error)
    return NextResponse.json({ error: "Error confirmando el pago" }, { status: 500 })
  }
}
