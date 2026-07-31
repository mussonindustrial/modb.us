import {
  VirtualDevice,
  VirtualDeviceId,
  VirtualDeviceManager,
} from '../virtual-device'
import {
  AddressSpace,
  RegisterType,
  WritableRegisterType,
} from '../address-space'
import { logger, Logger } from '../utils'
import { InMemoryAddressSpace } from './InMemoryAddressSpace'

export class InMemoryVirtualDevice implements VirtualDevice {
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

    this.addressSpace = new InMemoryAddressSpace()
    this.activeConnections = 0
    this.lastAccessed = Date.now()

    this.logger.debug('Virtual Device instantiated')
  }

  async read(
    type: RegisterType,
    address: number,
    quantity: number
  ): Promise<number[]> {
    const values = await this.addressSpace.read(type, address, quantity)
    this.logger.trace({ address, values }, 'Register read')
    return values
  }

  async write(type: WritableRegisterType, address: number, values: number[]) {
    this.logger.trace({ address, values }, 'Register write')
    await this.addressSpace.write(type, address, values)
  }

  async touch() {
    this.lastAccessed = Date.now()
  }

  async incrementConnections() {
    this.activeConnections++
  }
  async decrementConnections() {
    this.activeConnections--
  }
}
