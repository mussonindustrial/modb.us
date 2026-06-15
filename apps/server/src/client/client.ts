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

  constructor(id: VirtualDeviceId, deviceManager: VirtualDeviceManager) {
    this.logger = logger.child({
      id,
    })

    this.deviceManager = deviceManager

    this.addressSpace = new ClientAddressSpace(() => this.activeVirtualDevice)
    this.addressSpace.on('deviceIdChanged', async () => {
      await this.executeDeviceSwap()
    })
    this.addressSpace.deviceId = id

    this.logger.info('Client connected')
  }

  async executeDeviceSwap() {
    const oldId = this.activeVirtualDevice?.id
    const newId = this.addressSpace.deviceId

    if (oldId === newId) return

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

    this.addressSpace.removeAllListeners()

    if (this.activeVirtualDevice) {
      this.activeVirtualDevice.activeConnections--
      this.activeVirtualDevice.touch()
    }
  }
}
