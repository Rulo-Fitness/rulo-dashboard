import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const xSignature = request.headers.get("x-signature")
    const xRequestId = request.headers.get("x-request-id")
    const body = await request.json()

    const { id, type } = body

    console.log("[mp-webhook] Received:", { type, id, xRequestId })

    // Validate signature if secret is configured
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (secret && xSignature) {
      const parts = Object.fromEntries(
        xSignature.split(",").map((p) => {
          const [k, ...v] = p.split("=")
          return [k.trim(), v.join("=")]
        }),
      )

      const ts = parts.ts
      const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`
      const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex")

      if (hmac !== parts.v1) {
        console.warn("[mp-webhook] Invalid signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Process approved payments
    if (type === "payment") {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!accessToken) {
        console.error("[mp-webhook] MERCADOPAGO_ACCESS_TOKEN not set")
        return NextResponse.json({ status: "ok" })
      }

      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const payment = await mpRes.json()

      console.log("[mp-webhook] Payment status:", payment.status, "ref:", payment.external_reference)

      if (payment.status === "approved" && payment.external_reference) {
        const ref = JSON.parse(payment.external_reference) as { user_id: string; plan: string }

        const apiUrl = process.env.RULO_API_URL
        const apiKey = process.env.RULO_API_KEY
        if (apiUrl && apiKey) {
          const persistRes = await fetch(`${apiUrl}/payments`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: ref.user_id,
              mp_payment_id: String(id),
              plan: ref.plan,
              amount: payment.transaction_amount,
              currency: payment.currency_id,
              status: "approved",
            }),
          })

          if (!persistRes.ok) {
            const err = await persistRes.text()
            console.error("[mp-webhook] Failed to persist payment:", err)
          } else {
            console.log("[mp-webhook] Payment persisted for user:", ref.user_id)
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("[mp-webhook] Error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
