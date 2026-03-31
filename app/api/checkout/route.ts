import { MercadoPagoConfig, Preference } from "mercadopago"
import { NextResponse } from "next/server"

export async function POST() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    console.error("[checkout] MERCADOPAGO_ACCESS_TOKEN not set")
    return NextResponse.json({ error: "Configuración de pago incompleta" }, { status: 500 })
  }

  try {
    const client = new MercadoPagoConfig({ accessToken })
    const preference = new Preference(client)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const isHttps = baseUrl.startsWith("https://")

    const result = await preference.create({
      body: {
        items: [
          {
            id: "rulo-subscription",
            title: "Rulo Fitness — Suscripción mensual",
            quantity: 1,
            unit_price: 10,
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
        ...(isHttps && { auto_return: "approved" }),
      },
    })

    return NextResponse.json({ init_point: result.init_point })
  } catch (error) {
    console.error("[checkout] Error creating preference:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
