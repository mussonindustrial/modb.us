import { RedisClientType } from 'redis'

import {
  AddressSpace,
  logger,
  Logger,
  RegisterType,
  VirtualDevice,
  VirtualDeviceId,
  WritableRegisterType,
} from '@modb.us/core'

import { RedisAddressSpace } from './RedisAddressSpace'
import { RedisVirtualDeviceManager } from './RedisVirtualDeviceManager'

export class RedisVirtualDevice implements VirtualDevice {
  id: VirtualDeviceId
  addressSpace: AddressSpace
  deviceManager: RedisVirtualDeviceManager
  redis: RedisClientType
  logger: Logger

  constructor(id: VirtualDeviceId, deviceManager: RedisVirtualDeviceManager) {
    this.id = id
    this.deviceManager = deviceManager
    this.redis = this.deviceManager.redis
    this.logger = logger.child({ id })

    this.addressSpace = new RedisAddressSpace(id, this.redis)

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
    await this.redis.expire(`device:${this.id}`, 30)
  }

  async incrementConnections() {
    await this.redis.incr(`device:${this.id}:connections`)
  }
  async decrementConnections() {
    await this.redis.decr(`device:${this.id}:connections`)
  }
}
