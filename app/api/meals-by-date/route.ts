import { proxyGet } from "@/lib/api-proxy"

export async function GET(request: Request) {
  return proxyGet("/meals-by-date", request)
}
