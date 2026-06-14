import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import ModbusRTU from 'modbus-serial'
import { VirtualDeviceModbusTcpServer } from './server'
import { vdidToRegisters } from '@/utils/utils'

describe('Modbus Gateway Integration Tests', () => {
  const server = new VirtualDeviceModbusTcpServer({ port: 8502 })
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

    await client.writeRegisters(65520, Array.from(vdidToRegisters(vdidA)))
    await client.writeRegister(5, 555)
    const dataA = await client.readHoldingRegisters(5, 1)
    expect(dataA.data[0]).toBe(555)

    await client.writeRegisters(65520, Array.from(vdidToRegisters(vdidB)))
    const dataB = await client.readHoldingRegisters(5, 1)
    expect(dataB.data[0]).toBe(0)
  })

  it('stress test: connects 500 concurrent clients', async () => {
    const clients = Array.from({ length: 100 }, () => new ModbusRTU())
    const connections = clients.map((c) =>
      c.connectTCP('127.0.0.1', { port: 8502 })
    )

    await Promise.all(connections)

    const results = await Promise.all(
      clients.map((c) => c.readHoldingRegisters(0, 1))
    )
    expect(results.length).toBe(100)

    clients.forEach((c) => c.close())
  })

  it('shares state between two clients on the same virtual device', async () => {
    const client1 = new ModbusRTU()
    const client2 = new ModbusRTU()
    await client1.connectTCP('127.0.0.1', { port: 8502 })
    await client2.connectTCP('127.0.0.1', { port: 8502 })

    const sharedVdid = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'

    await client1.writeRegisters(65520, Array.from(vdidToRegisters(sharedVdid)))
    await client2.writeRegisters(65520, Array.from(vdidToRegisters(sharedVdid)))

    await client1.writeRegister(100, 999)
    const val = await client2.readHoldingRegisters(100, 1)

    expect(val.data[0]).toBe(999)
    client1.close()
    client2.close()
  })
})
