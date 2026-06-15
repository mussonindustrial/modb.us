import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import ModbusRTU from 'modbus-serial'

import { ModbusTcpServer } from '@/server'
import { vdidToRegisters } from '@/utils'
import { VirtualDeviceManager } from '@/virtual-device'
import { TcpFrameFactory } from '@/message'

const virtualDeviceManager = new VirtualDeviceManager()

describe('Modbus Gateway Integration Tests', () => {
  const server = new ModbusTcpServer({
    port: 8502,
    virtualDeviceManager,
    frameFactory: TcpFrameFactory,
  })
  const client = new ModbusRTU()

  beforeAll(async () => {
    server.start()
    await client.connectTCP('127.0.0.1', { port: 8502 })
  })

  afterAll(() => {
    client.close()
    server.stop()
  })

  it('performs basic Read/Write (FC3/FC6)', async () => {
    await client.writeRegister(10, 123)
    const data = await client.readHoldingRegisters(10, 1)
    expect(data.data[0]).toBe(123)
  })

  it('swaps virtual devices using lobby registers', async () => {
    const vdidA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const vdidB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

    await client.writeRegisters(999 - 16, Array.from(vdidToRegisters(vdidA)))
    await client.writeRegister(5, 555)
    const dataA = await client.readHoldingRegisters(5, 1)
    expect(dataA.data[0]).toBe(555)

    await client.writeRegisters(999 - 16, Array.from(vdidToRegisters(vdidB)))
    const dataB = await client.readHoldingRegisters(5, 1)
    expect(dataB.data[0]).toBe(0)
  })

  // it('stress test: connects 500 concurrent clients', async () => {
  //   const clients = Array.from({ length: 100 }, () => new ModbusRTU())
  //   const connections = clients.map((c) =>
  //     c.connectTCP('127.0.0.1', { port: 8502 })
  //   )
  //
  //   await Promise.all(connections)
  //
  //   const results = await Promise.all(
  //     clients.map((c) => c.readHoldingRegisters(0, 1))
  //   )
  //   expect(results.length).toBe(100)
  //
  //   clients.forEach((c) => c.close())
  // })

  it('shares state between two clients on the same virtual device', async () => {
    const client1 = new ModbusRTU()
    await client1.connectTCP('127.0.0.1', { port: 8502 })

    const client2 = new ModbusRTU()
    await client2.connectTCP('127.0.0.1', { port: 8502 })

    const sharedVdid = 'cccccccccccccccccccccccccccccccc'

    await client1.writeRegisters(
      999 - 16,
      Array.from(vdidToRegisters(sharedVdid))
    )
    await client2.writeRegisters(
      999 - 16,
      Array.from(vdidToRegisters(sharedVdid))
    )

    await client1.writeRegister(100, 999)
    const client1Result = await client1.readHoldingRegisters(100, 1)
    expect(client1Result.data[0]).toBe(999)

    const client2Result = await client2.readHoldingRegisters(100, 1)
    expect(client2Result.data[0]).toBe(999)

    client1.close()
    client2.close()
  })
})
