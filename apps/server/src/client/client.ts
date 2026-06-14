import net from 'net'

import { logger, Logger } from '@/utils/logger'
import {
  VirtualDevice,
  VirtualDeviceId,
  VirtualDeviceManager,
} from '@/virtualDevice'
import { ClientAddressSpace } from '@/client/addressSpace'

export class ModbusClient {
  addressSpace: ClientAddressSpace
  deviceManager: VirtualDeviceManager
  activeVirtualDevice: VirtualDevice | null = null
  logger: Logger

  private swapTimer: NodeJS.Timeout | null = null
  private lastSwapTime = 0
  private swapCooldownMs = 5000

  constructor(
    id: VirtualDeviceId,
    socket: net.Socket,
    deviceManager: VirtualDeviceManager
  ) {
    this.logger = logger.child({
      id,
      ip: socket.remoteAddress,
    })

    this.deviceManager = deviceManager

    this.addressSpace = new ClientAddressSpace(() => this.activeVirtualDevice)
    this.addressSpace.on('deviceIdChanged', () => {
      this.queueDeviceSwap()
    })
    this.addressSpace.deviceId = id
    this.queueDeviceSwap()

    this.logger.info('Client connected')
  }

  private queueDeviceSwap() {
    if (this.swapTimer) clearTimeout(this.swapTimer)
    this.swapTimer = setTimeout(() => this.executeDeviceSwap(), 100)
  }

  async executeDeviceSwap() {
    const oldId = this.activeVirtualDevice?.id
    const newId = this.addressSpace.deviceId

    if (oldId === newId) return

    const now = Date.now()
    const elapsed = now - this.lastSwapTime

    if (elapsed < this.swapCooldownMs) {
      const remaining = this.swapCooldownMs - elapsed

      this.logger.warn(
        { oldId, newId, remaining },
        'Swap rate limit exceeded. Delaying swap.'
      )

      this.addressSpace.locked = true

      if (this.swapTimer) clearTimeout(this.swapTimer)

      this.swapTimer = setTimeout(() => {
        this.addressSpace.locked = false
        this.executeDeviceSwap()
      }, remaining)

      return
    }

    this.addressSpace.locked = false

    this.logger.debug({ oldId, newId }, 'Virtual Device swap triggered')

    if (this.activeVirtualDevice) {
      this.activeVirtualDevice.activeConnections--
      this.activeVirtualDevice.touch()
    }

    this.activeVirtualDevice = await this.deviceManager.getOrCreate(newId)
    this.activeVirtualDevice.activeConnections++

    this.lastSwapTime = now

    this.logger.info(
      { oldId, newId },
      'Client successfully swapped Virtual Device Target'
    )
  }

  close() {
    this.logger.info('Client socket closed, detaching from Virtual Device')

    if (this.swapTimer) clearTimeout(this.swapTimer)
    this.addressSpace.removeAllListeners()

    if (this.activeVirtualDevice) {
      this.activeVirtualDevice.activeConnections--
      this.activeVirtualDevice.touch()
    }
  }
}
