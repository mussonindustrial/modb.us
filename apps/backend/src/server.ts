import express from 'express'
import cors from 'cors'
import http from 'http'
import { IServiceVector, ServerTCP } from 'modbus-serial'
import { WebSocketServer } from 'ws'

export const memory = {
  holdingRegisters: new Uint16Array(65535),
  inputRegisters: new Uint16Array(65535),
  coils: new Array<boolean>(65535).fill(false),
  discreteInputs: new Array<boolean>(65535).fill(false),
}

const MODBUS_PORT = 5020

const app = express()
app.use(cors())
app.use(express.json())

const wss = new WebSocketServer({
  noServer: true,
})

function broadcastState() {
  const state = {
    holdingRegisters: Array.from(memory.holdingRegisters),
    inputRegisters: Array.from(memory.inputRegisters),
    coils: memory.coils,
    discreteInputs: memory.discreteInputs,
    timestamp: Date.now(),
  }

  const json = JSON.stringify(state)

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(json)
    }
  })
}

const vector: IServiceVector = {
  getHoldingRegister(addr: number) {
    return memory.holdingRegisters[addr] ?? 0
  },

  getInputRegister(addr: number) {
    return memory.inputRegisters[addr] ?? 0
  },

  getCoil(addr: number) {
    return memory.coils[addr] ?? false
  },

  getDiscreteInput(addr: number) {
    return memory.discreteInputs[addr] ?? false
  },

  setRegister(addr: number, value: number) {
    memory.holdingRegisters[addr] = value
    broadcastState()
  },

  setCoil(addr: number, value: boolean) {
    memory.coils[addr] = value
    broadcastState()
  },
}

new ServerTCP(vector, {
  host: '0.0.0.0',
  port: MODBUS_PORT,
  debug: false,
  unitID: 1,
})

const PORT = 3001
const server = http.createServer(app)

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})

server.listen(PORT, () => {
  console.log(`API running on ${PORT}`)
})

app.get('/api/state', (_req, res) => {
  res.json({
    holdingRegisters: Array.from(memory.holdingRegisters),
    inputRegisters: Array.from(memory.inputRegisters),
    coils: memory.coils,
    discreteInputs: memory.discreteInputs,
  })
})
