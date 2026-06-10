import express from 'express'
import cors from 'cors'
import http from 'http'
import { WebSocketServer } from 'ws'
import { activeInstances } from './modbus'
import { db } from './db'
import { createDnsServer } from './dns'
import { createRouter } from './router'

function startCleanup(timeoutMs: number) {
  setInterval(() => {
    const now = Date.now()
    for (const [serverName, instance] of activeInstances.entries()) {
      if (now - instance.lastAccessed > timeoutMs) {
        console.log(
          `[Manager] Shutting down ${serverName} due to inactivity...`
        )

        void db.saveState(serverName, {
          holdingRegisters: instance.memory.holdingRegisters,
          coils: instance.memory.coils,
        })

        if (instance.server) {
          instance.server.close(() => {})
        }

        activeInstances.delete(serverName)
      }
    }
  }, 5000)
}

const app = express()
app.use(cors())
app.use(express.json())

const wss = new WebSocketServer({ noServer: true })

// function broadcastState(serverName: string) {
//   const instance = activeInstances.get(serverName)
//   if (!instance) return
//
//   const state = {
//     serverName,
//     holdingRegisters: Array.from(instance.memory.holdingRegisters),
//     coils: instance.memory.coils,
//     timestamp: Date.now(),
//   }
//
//   const json = JSON.stringify(state)
//   wss.clients.forEach((client) => {
//     if (client.readyState === client.OPEN) {
//       client.send(json)
//     }
//   })
// }

app.get('/api/state/:serverName', async (req, res) => {
  const { serverName } = req.params
  const instance = activeInstances.get(serverName)

  if (instance) {
    res.json({
      active: true,
      holdingRegisters: Array.from(instance.memory.holdingRegisters),
      coils: instance.memory.coils,
    })
  } else {
    const savedState = await db.getState(serverName)
    res.json({ active: false, ...savedState })
  }
})

const server = http.createServer(app)
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})

type ModbUsConfig = {
  dnsPort: number
  modbusPort: number
  httpPort: number
  ipv6Prefix: string
  timeoutMs: number
}

export async function startModbUs(config: ModbUsConfig) {
  const router = createRouter()
  router.listen(config.modbusPort, '::', () => {
    console.log(
      `[Router] Direct IPv6 router listening on [::]:${config.modbusPort}`
    )
  })

  const dnsServer = createDnsServer({ ipv6Prefix: config.ipv6Prefix })
  await dnsServer.listen({ udp: config.dnsPort })
  console.log(`[DNS] Authoritative server running on port ${config.dnsPort}`)

  server.listen(config.httpPort, () => {
    console.log(`[HTTP/WS] API running on port ${config.httpPort}`)
  })

  startCleanup(config.timeoutMs)

  return {
    async close() {
      router.close()
      await dnsServer.close()
      server.close()

      for (const instance of activeInstances.values()) {
        instance.server.close(() => {})
      }
      activeInstances.clear()
    },
  }
}
