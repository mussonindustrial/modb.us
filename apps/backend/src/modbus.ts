import { IServiceVector, ServerTCP } from 'modbus-serial'
import { db } from './db'
import net from 'net'

type ModbusInstance = {
  ip: string
  port: number
  server: ServerTCP
  memory: ModbusServerMemory
  lastAccessed: number
}

export type ModbusServerMemory = {
  holdingRegisters: Uint16Array
  coils: boolean[]
}

export const activeInstances = new Map<string, ModbusInstance>()

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as net.AddressInfo).port
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

export async function ensureModbusServer(
  serverName: string,
  ip: string
): Promise<ModbusInstance> {
  const instance = activeInstances.get(serverName)
  if (instance) {
    instance.lastAccessed = Date.now()
    return instance
  }

  const savedState = await db.getState(serverName)
  const memory = {
    holdingRegisters: savedState?.holdingRegisters ?? new Uint16Array(65535),
    coils: savedState?.coils ?? new Array<boolean>(65535).fill(false),
  }

  const touch = () => {
    const inst = activeInstances.get(serverName)
    if (inst) inst.lastAccessed = Date.now()
  }

  const vector: IServiceVector = {
    getHoldingRegister(addr: number) {
      touch()
      return memory.holdingRegisters[addr] ?? 0
    },
    getInputRegister(addr: number) {
      touch()
      return memory.holdingRegisters[addr] ?? 0
    },
    getCoil(addr: number) {
      touch()
      return memory.coils[addr] ?? false
    },
    getDiscreteInput(addr: number) {
      touch()
      return memory.coils[addr] ?? false
    },

    setRegister(addr: number, value: number) {
      touch()
      memory.holdingRegisters[addr] = value
    },
    setCoil(addr: number, value: boolean) {
      touch()
      memory.coils[addr] = value
    },
  }
  const port = await getFreePort()

  return new Promise((resolve, reject) => {
    const modbusServer = new ServerTCP(vector, {
      host: '127.0.0.1',
      port,
      debug: false,
      unitID: 1,
    })

    modbusServer.on('initialized', () => {
      const newInstance: ModbusInstance = {
        ip,
        port,
        server: modbusServer,
        memory,
        lastAccessed: Date.now(),
      }

      activeInstances.set(serverName, newInstance)
      console.log(`[Manager] Spun up logic for ${serverName} (IPv6: ${ip})`)
      resolve(newInstance)
    })

    modbusServer.on('error', (err) => reject(err))
  })
}
