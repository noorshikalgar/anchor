import type { Request, Response, NextFunction } from 'express'
import { verifyToken, signToken, setAuthCookie, COOKIE } from '../lib/auth'

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE]
  if (!token) { res.status(401).json({ error: 'Not authenticated' }); return }
  try {
    const payload = verifyToken(token)
    req.userId = payload.sub
    // Sliding session: reissue the cookie so active users never hit expiry
    setAuthCookie(res, signToken(payload.sub))
    next()
  } catch {
    res.status(401).json({ error: 'Session expired' })
  }
}
