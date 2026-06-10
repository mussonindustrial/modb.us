import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import dns2 from 'dns2'
import ModbusRTU from 'modbus-serial'
import { startModbUs, db, activeInstances } from './index'

describe('Modbus Scale-To-Zero Backend', () => {
  let environment: { close: () => Promise<void> }

  const config = {
    dnsPort: 53535,
    modbusPort: 5020,
    httpPort: 30010,
    ipv6Prefix: '2001:db8:aaaa:bbbb',
    timeoutMs: 30000,
  }

  beforeAll(async () => {
    environment = await startModbUs(config)
  })

  afterAll(async () => {
    await environment.close()
  })

  it('should answer DNS AAAA queries and generate an IPv6 address', async () => {
    const dns = new dns2({
      nameServers: ['127.0.0.1'],
      port: config.dnsPort,
    })

    for (let i = 0; i < 100; i++) {
      const serverName = `test-server-${i}`
      const response = await dns.resolveAAAA(`${serverName}.tcp.modb.us`)

      expect(response.answers.length).toBe(1)
      expect(response.answers[0].address).toContain(config.ipv6Prefix)

      const savedIp = await db.getIpv6(serverName)
      expect(savedIp).toBe(response.answers[0].address)
    }
  })

  it('should route TCP traffic to the correct scaled-to-zero instance', async () => {
    const testIp = '::1'
    const serverName = 'test-server'
    await db.saveIpv6(serverName, testIp)

    const client = new ModbusRTU()
    await client.connectTCP(testIp, { port: config.modbusPort })
    client.setID(1)

    await client.writeCoil(5, true)
    expect((await client.readCoils(5, 1)).data[0]).toBe(true)

    await client.writeRegister(500, 12345)
    expect((await client.readHoldingRegisters(500, 1)).data[0]).toBe(12345)

    const instance = activeInstances.get(serverName)
    expect(instance).toBeDefined()
    expect(instance?.memory.coils[5]).toBe(true)
    expect(instance?.memory.holdingRegisters[500]).toBe(12345)

    client.close(() => {})
  })
})
