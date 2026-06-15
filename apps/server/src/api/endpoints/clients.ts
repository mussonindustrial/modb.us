import { Context } from 'hono'

export function getClientCount(c: Context) {
  return c.json({ result: 'Wow!' })
}
