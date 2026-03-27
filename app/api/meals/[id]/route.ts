import { proxyPut, proxyDelete } from "@/lib/api-proxy"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyPut(`/meals/${id}`, request)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyDelete(`/meals/${id}`)
}
