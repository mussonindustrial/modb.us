import dns2, { Packet } from 'dns2'
import { db } from './db'
import { ensureModbusServer } from './modbus'
import { generateIpv6Suffix } from './ipv6'

export type ModbUsDnsConfig = {
  ipv6Prefix: string
}
export function createDnsServer(config: ModbUsDnsConfig) {
  return dns2.createServer({
    udp: true,
    handle: async (request, send) => {
      const response = Packet.createResponseFromRequest(request)
      const [question] = request.questions
      const { name } = question

      if (question && question.type === Packet.TYPE.AAAA) {
        const match = question.name.match(/^(.+)\.tcp\.modb\.us$/i)

        if (match) {
          const serverName = match[1]
          let ipv6 = await db.getIpv6(serverName)

          if (!ipv6) {
            ipv6 = `${config.ipv6Prefix}:${generateIpv6Suffix()}`
            await db.saveIpv6(serverName, ipv6)
          }

          // Proactively wake up the server when DNS is queried
          await ensureModbusServer(serverName, ipv6)
          response.answers.push({
            name: name,
            type: Packet.TYPE.AAAA,
            class: Packet.CLASS.IN,
            ttl: 0,
            address: ipv6,
          } as never)
        }
      }
      await send(response)
    },
  })
}
