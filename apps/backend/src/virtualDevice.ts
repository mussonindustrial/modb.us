import crypto from 'crypto'
import net from 'net'

import {
  AddressSpace,
  AllocatedAddressSpace,
  RegisterType,
  WritableRegisterType,
} from '@/addressSpace'
import { Logger, logger } from '@/logger'
import { ModbusClient } from '@/client'

export type VirtualDeviceId = string

export class VirtualDevice {
  id: VirtualDeviceId
  addressSpace: AddressSpace
  activeConnections: number
  lastAccessed: number
  deviceManager: VirtualDeviceManager
  logger: Logger

  constructor(id: VirtualDeviceId, deviceManager: VirtualDeviceManager) {
    this.id = id
    this.deviceManager = deviceManager
    this.logger = logger.child({ id })

    this.addressSpace = new AllocatedAddressSpace()
    this.activeConnections = 0
    this.lastAccessed = Date.now()

    this.logger.debug('Virtual Device instantiated')
  }

  touch() {
    this.lastAccessed = Date.now()
  }

  read(type: RegisterType, address: number) {
    const value = this.addressSpace.read(type, address)
    this.logger.trace({ address, value }, 'Register read')
    return value
  }

  write(type: WritableRegisterType, address: number, value: number) {
    const safeValue = value & 0xffff
    this.logger.trace({ address, value: safeValue }, 'Register write')
    this.addressSpace.write(type, address, safeValue)
  }
}

export class VirtualDeviceManager {
  devices: Map<VirtualDeviceId, VirtualDevice>
  deviceTtlMs: number

  constructor({ deviceTtlMs = 30000 } = {}) {
    this.devices = new Map()
    this.deviceTtlMs = deviceTtlMs
    setInterval(() => this.closeIdleSockets(), 5000)

    logger.info({ ttl: this.deviceTtlMs }, 'Virtual Device Manager initialized')
  }

  async createClientSocket(socket: net.Socket) {
    const id = crypto.randomUUID().replace(/-/g, '')
    const clientSocket = new ModbusClient(id, socket, this)

    logger.debug(
      { socketId: id, ip: socket.remoteAddress },
      'New client socket created'
    )

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

    device.touch()
    return device
  }

  async loadVirtualDevice(id: VirtualDeviceId): Promise<VirtualDevice> {
    return new VirtualDevice(id, this)
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
