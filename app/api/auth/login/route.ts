import { proxyPost } from "@/lib/api-proxy"

export async function POST(request: Request) {
  return proxyPost("/auth/login", request)
}
