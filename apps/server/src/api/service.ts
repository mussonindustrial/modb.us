import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { VirtualDeviceManager } from '@/virtualDevice'
import { getClientCount } from '@/api/endpoints/clients'

export type ApiServerConfig = {
  port: number
  deviceManager: VirtualDeviceManager
}

export class ApiServer {
  port: number
  deviceManager: VirtualDeviceManager

  constructor({ port = 3000, deviceManager }: ApiServerConfig) {
    this.port = port
    this.deviceManager = deviceManager
  }

  start() {
    const app = new Hono()
    app.get('/status', (c) => c.text('OK'))
    app.get('/client', getClientCount)

    const server = serve({
      fetch: app.fetch,
      port: this.port,
    })

    process.on('SIGINT', () => {
      server.close()
      process.exit(0)
    })
    process.on('SIGTERM', () => {
      server.close((err) => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
        process.exit(0)
      })
    })
  }
}
