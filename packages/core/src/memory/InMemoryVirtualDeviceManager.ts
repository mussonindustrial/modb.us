import crypto from 'crypto'

import { ModbusClient } from '../client'
import { InMemoryVirtualDevice } from './InMemoryVirtualDevice'
import { logger } from '../utils'
import { VirtualDeviceId, VirtualDeviceManager } from '../virtual-device'

export class InMemoryVirtualDeviceManager implements VirtualDeviceManager {
  devices: Map<VirtualDeviceId, InMemoryVirtualDevice>
  deviceTtlMs: number

  constructor({ deviceTtlMs = 30000 } = {}) {
    this.devices = new Map()
    this.deviceTtlMs = deviceTtlMs
    setInterval(() => this.closeIdleSockets(), 5000)

    logger.info({ ttl: this.deviceTtlMs }, 'Virtual Device Manager initialized')
  }

  async createClient() {
    const id = crypto.randomUUID().replace(/-/g, '')
    const clientSocket = new ModbusClient(id, this)
    await clientSocket.executeDeviceSwap()
    return clientSocket
  }

  async getOrCreate(id: VirtualDeviceId) {
    let device = this.devices.get(id)

    if (!device) {
      logger.debug({ id }, 'Device not found in memory, loading new instance')
      device = await this.loadVirtualDevice(id)
      this.devices.set(id, device)
    } else {
      logger.trace({ id }, 'Retrieved existing Virtual Device from memory')
    }

    await device.touch()
    return device
  }

  async loadVirtualDevice(id: VirtualDeviceId): Promise<InMemoryVirtualDevice> {
    return new InMemoryVirtualDevice(id, this)
  }

  async closeIdleSockets() {
    const now = Date.now()
    let closedCount = 0

    for (const [id, device] of this.devices.entries()) {
      const expired =
        device.activeConnections === 0 &&
        now - device.lastAccessed > this.deviceTtlMs

      if (expired) {
        device.logger.debug('Device TTL expired, closing from memory')
        this.devices.delete(id)
        closedCount++
      }
    }

    if (now > 0) {
      logger.trace(
        { closedCount, remaining: this.devices.size },
        'Closed idle virtual devices'
      )
    }
  }
}
