import { z } from 'zod'

export const EnvironmentSchema = z.object({
  SERVER_PROTOCOL: z.enum(['tcp', 'udp', 'rtu-tcp', 'rtu-udp']),
  SERVER_PORT: z.string().transform((val) => parseInt(val, 10)),
  REDIS_URL: z.url(),
})

const result = EnvironmentSchema.safeParse(process.env)

if (!result.success) {
  const pretty = z.prettifyError(result.error)
  console.error('Invalid environment variables:', pretty)
  process.exit(1)
}

export const env = result.data
