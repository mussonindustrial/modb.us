import { ModbusServerMemory } from './modbus'
import { Ipv6Address } from './ipv6'

export const db = {
  ips: new Map<string, Ipv6Address>(),
  states: new Map<string, ModbusServerMemory>(),

  async getIpv6(serverName: string): Promise<Ipv6Address | undefined> {
    return this.ips.get(serverName)
  },

  async saveIpv6(serverName: string, ip: Ipv6Address) {
    this.ips.set(serverName, ip)
  },

  async getServerNameByIpv6(ip: Ipv6Address): Promise<string | undefined> {
    for (const [name, savedIp] of this.ips.entries()) {
      if (savedIp === ip) return name
    }
    return undefined
  },

  async getState(serverName: string): Promise<ModbusServerMemory | undefined> {
    return this.states.get(serverName)
  },

  async saveState(serverName: string, state: ModbusServerMemory) {
    this.states.set(serverName, state)
  },
}
