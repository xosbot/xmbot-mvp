const rateMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(options: {
  identifier: string
  maxRequests: number
  windowMs: number
}): boolean {
  const now = Date.now()
  const key = options.identifier
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + options.windowMs })
    return true
  }

  if (entry.count >= options.maxRequests) {
    return false
  }

  entry.count++
  return true
}
