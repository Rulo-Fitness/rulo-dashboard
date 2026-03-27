import { proxyGet } from "@/lib/api-proxy"

export async function GET(request: Request) {
  return proxyGet("/workout-logs-by-range", request)
}
