import { proxyGet, proxyPost } from "@/lib/api-proxy"

export async function GET(request: Request) {
  return proxyGet("/workout-logs", request)
}

export async function POST(request: Request) {
  return proxyPost("/workout-logs", request)
}
