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

    // Log the event — persistence comes later
    console.log("[mp-webhook] Payment event:", { type, paymentId: id })

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("[mp-webhook] Error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
