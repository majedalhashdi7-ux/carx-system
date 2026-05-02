import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate Limiting Store
const rateLimitMap = new Map<string, { count: number, timestamp: number }>()
const RATE_LIMIT = 100 // 100 requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // CORS Configuration
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'https://carx-system.vercel.app',
    'https://daood.okigo.net',
    'http://localhost:3000',
    process.env.NEXTAUTH_URL || ''
  ]

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Rate Limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (userLimit) {
    if (now - userLimit.timestamp > RATE_WINDOW) {
      rateLimitMap.set(ip, { count: 1, timestamp: now })
    } else if (userLimit.count >= RATE_LIMIT) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    } else {
      userLimit.count++
    }
  } else {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
  }

  // Clean up old entries
  rateLimitMap.forEach((value, key) => {
    if (now - value.timestamp > RATE_WINDOW) {
      rateLimitMap.delete(key)
    }
  })

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  return response
}

export const config = {
  matcher: '/api/:path*',
}
