import jwt from 'jsonwebtoken'
import type { Response } from 'express'

const SECRET = process.env.JWT_SECRET!
const EXPIRES_IN = '30d'
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
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE, { path: '/' })
}

export { COOKIE }
