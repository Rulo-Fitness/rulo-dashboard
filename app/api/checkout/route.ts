import { MercadoPagoConfig, Preference } from "mercadopago"
import { NextResponse } from "next/server"

const PLAN_PRICES: Record<string, number> = {
  maquina: 4999,
  fiera: 9999,
  bestia: 19999,
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    console.error("[checkout] MERCADOPAGO_ACCESS_TOKEN not set")
    return NextResponse.json({ error: "Configuración de pago incompleta" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { user_id, plan } = body as { user_id?: string; plan?: string }

    if (!user_id || !plan) {
      return NextResponse.json({ error: "Faltan user_id o plan" }, { status: 400 })
    }

    const planKey = plan.toLowerCase()
    const unitPrice = PLAN_PRICES[planKey] ?? 10

    const client = new MercadoPagoConfig({ accessToken })
    const preference = new Preference(client)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const isHttps = baseUrl.startsWith("https://")

    const result = await preference.create({
      body: {
        items: [
          {
            id: "rulo-subscription",
            title: `Rulo Fitness — Plan ${plan}`,
            quantity: 1,
            unit_price: unitPrice,
            currency_id: "ARS",
          },
        ],
        external_reference: JSON.stringify({ user_id, plan: planKey }),
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
        ...(isHttps && { auto_return: "approved" }),
        ...(isHttps && { notification_url: `${baseUrl}/api/webhooks/mp` }),
      },
    })

    return NextResponse.json({ init_point: result.init_point })
  } catch (error) {
    console.error("[checkout] Error creating preference:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
