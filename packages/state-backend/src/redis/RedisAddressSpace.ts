import { RedisClientType } from 'redis'

import { AddressSpace, RegisterType, WritableRegisterType } from '@modb.us/core'

export class RedisAddressSpace implements AddressSpace {
  id: string
  redis: RedisClientType

  static readonly maxAddress: number = 999

  constructor(id: string, redis: RedisClientType) {
    this.id = id
    this.redis = redis
  }

  private getKey(type: RegisterType): string {
    return `device:${this.id}:${type}`
  }

  async read(
    type: RegisterType,
    address: number,
    quantity: number
  ): Promise<number[]> {
    const key = this.getKey(type)

    switch (type) {
      case 'coil':
      case 'discreteInput': {
        const multi = this.redis.multi()
        for (let i = 0; i < quantity; i++) {
          multi.getBit(key, address + i)
        }

        const results = await multi.exec()
        return results.map((res) => (res ? Number(res) : 0))
      }

      case 'holdingRegister':
      case 'inputRegister': {
        const fields = Array.from({ length: quantity }, (_, i) =>
          (address + i).toString()
        )

        const results = await this.redis.hmGet(key, fields)
        return results.map((result) => (result ? parseInt(result, 10) : 0))
      }

      default: {
        return new Array(quantity).fill(0)
      }
    }
  }

  async write(
    type: WritableRegisterType,
    address: number,
    values: number[]
  ): Promise<void> {
    const key = this.getKey(type)

    switch (type) {
      case 'coil': {
        const multi = this.redis.multi()
        values.forEach((value, index) => {
          multi.setBit(key, address + index, value === 1 ? 1 : 0)
        })
        await multi.exec()
        break
      }

      case 'holdingRegister': {
        const data: Record<string, string> = {}
        values.forEach((value, index) => {
          data[(address + index).toString()] = value.toString()
        })

        await this.redis.hSet(key, data)
        break
      }
    }
  }

  async contains(address: number, length: number): Promise<boolean> {
    return address >= 0 && address + length <= RedisAddressSpace.maxAddress
  }
}
