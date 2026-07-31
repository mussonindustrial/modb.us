import crypto from 'crypto'
import { RedisClientType } from 'redis'

import {
  VirtualDeviceManager,
  VirtualDevice,
  ModbusClient,
} from '@modb.us/core'

import { RedisVirtualDevice } from './RedisVirtualDevice'

export class RedisVirtualDeviceManager implements VirtualDeviceManager {
  redis: RedisClientType

  constructor(redisClient: RedisClientType) {
    this.redis = redisClient
  }

  async createClient(): Promise<ModbusClient> {
    const id = crypto.randomUUID().replace(/-/g, '')
    const clientSocket = new ModbusClient(id, this)
    await clientSocket.executeDeviceSwap()
    return clientSocket
  }

  async getOrCreate(id: string): Promise<VirtualDevice> {
    return new RedisVirtualDevice(id, this)
  }
}
