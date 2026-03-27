const API_URL = (process.env.RULO_API_URL ?? "").replace(/\/$/, "")
const API_KEY = process.env.RULO_API_KEY ?? ""

export async function proxyGet(path: string, request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const url = `${API_URL}${path}${searchParams.toString() ? `?${searchParams}` : ""}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

export async function proxyPost(path: string, request: Request): Promise<Response> {
  const body = await request.text()
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body,
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

export async function proxyPut(path: string, request: Request): Promise<Response> {
  const body = await request.text()
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body,
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

export async function proxyDelete(path: string): Promise<Response> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_KEY}` },
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}
