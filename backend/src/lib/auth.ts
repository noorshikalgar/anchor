import jwt from 'jsonwebtoken'
import type { Response } from 'express'

const SECRET = process.env.JWT_SECRET!
const EXPIRES_DAYS = Number(process.env.JWT_EXPIRES_DAYS ?? 180)
const EXPIRES_IN = EXPIRES_DAYS * 24 * 60 * 60 // jwt expiresIn as seconds
const COOKIE = 'anchor_token'

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, SECRET) as { sub: string }
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE, { path: '/' })
}

export { COOKIE }
