import { logger, Logger } from '../utils'
import {
  VirtualDevice,
  VirtualDeviceId,
  VirtualDeviceManager,
} from '../virtual-device'
import { ClientAddressSpace } from './ClientAddressSpace'

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
      await this.activeVirtualDevice.decrementConnections()
      await this.activeVirtualDevice.touch()
    }

    this.activeVirtualDevice = await this.deviceManager.getOrCreate(newId)
    await this.activeVirtualDevice.incrementConnections()

    this.logger.info(
      { oldId, newId },
      'Client successfully swapped Virtual Device Target'
    )
  }

  close() {
    this.logger.info('Client socket closed, detaching from Virtual Device')

    this.addressSpace.removeAllListeners()

    if (this.activeVirtualDevice) {
      void Promise.all([
        this.activeVirtualDevice.decrementConnections(),
        this.activeVirtualDevice.touch(),
      ])
    }
  }
}
