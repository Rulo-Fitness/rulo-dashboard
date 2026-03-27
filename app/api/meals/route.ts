import { proxyGet, proxyPost } from "@/lib/api-proxy"

export async function GET(request: Request) {
  return proxyGet("/meals", request)
}

export async function POST(request: Request) {
  return proxyPost("/meals", request)
}
