import crypto from 'crypto'
import { Logger, logger } from './logger'
import net from 'net'

export type VirtualDeviceId = string

export class VirtualDevice {
  id: VirtualDeviceId
  registers: Uint16Array<ArrayBuffer>
  activeConnections: number
  lastAccessed: number
  deviceManager: VirtualDeviceManager
  logger: Logger

  constructor(id: VirtualDeviceId, deviceManager: VirtualDeviceManager) {
    this.id = id
    this.deviceManager = deviceManager
    this.logger = logger.child({ id })

    this.registers = new Uint16Array(65520)
    this.activeConnections = 0
    this.lastAccessed = Date.now()

    this.logger.debug('Virtual Device instantiated')
  }

  touch() {
    this.lastAccessed = Date.now()
  }

  read(address: number) {
    const value = this.registers[address]
    this.logger.trace({ address, value }, 'Register read')
    return value
  }

  write(address: number, value: number) {
    const safeValue = value & 0xffff
    this.logger.trace({ address, value: safeValue }, 'Register write')
    this.registers[address] = safeValue
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
    const clientSocket = new ModbusClientSocket(id, socket, this)

    logger.debug(
      { socketId: id, ip: socket.remoteAddress },
      'New client socket created'
    )

    await clientSocket.maybeSwitchVirtualDevice()
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

export class ModbusClientSocket {
  switchboardRegisters: Uint16Array<ArrayBuffer>
  deviceManager: VirtualDeviceManager
  activeVirtualDevice: VirtualDevice | null = null
  logger: Logger

  constructor(
    id: VirtualDeviceId,
    socket: net.Socket,
    deviceManager: VirtualDeviceManager
  ) {
    this.switchboardRegisters = new Uint16Array(16)
    this.deviceManager = deviceManager

    this.logger = logger.child({
      id,
      ip: socket.remoteAddress,
    })

    this.writeVirtualDeviceId(id)
    this.logger.info('Client connected')
  }

  writeVirtualDeviceId(id: VirtualDeviceId) {
    const clean = id.replace(/-/g, '').padEnd(32, '0')
    this.logger.trace({ id: clean }, 'Writing VDID to switchboard registers')

    for (let i = 0; i < 16; i++) {
      const c1 = clean.charCodeAt(i * 2) || 0
      const c2 = clean.charCodeAt(i * 2 + 1) || 0
      this.switchboardRegisters[i] = (c1 << 8) | c2
    }
  }

  readVirtualDeviceId() {
    let id = ''
    for (let i = 0; i < 16; i++) {
      const reg = this.switchboardRegisters[i]
      id += String.fromCharCode((reg >> 8) & 0xff)
      id += String.fromCharCode(reg & 0xff)
    }
    return id.trim()
  }

  async maybeSwitchVirtualDevice() {
    const oldId = this.activeVirtualDevice?.id
    const newId = this.readVirtualDeviceId()

    if (oldId === newId) {
      return
    }

    this.logger.debug({ oldId, newId }, 'Virtual Device swap triggered')

    if (this.activeVirtualDevice) {
      this.activeVirtualDevice.activeConnections--
      this.activeVirtualDevice.touch()
    }

    this.activeVirtualDevice = await this.deviceManager.getOrCreate(newId)
    this.activeVirtualDevice.activeConnections++

    this.logger.info(
      { oldId, newId },
      'Client successfully swapped Virtual Device Target'
    )
  }

  close() {
    this.logger.info('Client socket closed, detaching from Virtual Device')
    if (this.activeVirtualDevice) {
      this.activeVirtualDevice.activeConnections--
      this.activeVirtualDevice.touch()
    }
  }
}
