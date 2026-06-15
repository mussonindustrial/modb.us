import { EventEmitter } from 'events'
import {
  AddressSpace,
  RegisterType,
  WritableRegisterType,
} from '@/address-space'
import { VirtualDevice } from '@/virtual-device'
import { ModbusProtocolError } from '@/error'

interface ClientAddressSpaceEvents {
  deviceIdChanged: [newId: string]
}

export class ClientAddressSpace
  extends EventEmitter<ClientAddressSpaceEvents>
  implements AddressSpace
{
  static deviceIdStart = 999 - 16
  deviceIdMemory: Uint16Array<ArrayBuffer>
  locked: boolean = false

  constructor(private readonly getActiveDevice: () => VirtualDevice | null) {
    super()
    this.deviceIdMemory = new Uint16Array(16)
  }

  get deviceId(): string {
    let id = ''
    for (let i = 0; i < 16; i++) {
      const reg = this.deviceIdMemory[i]
      id += String.fromCharCode((reg >> 8) & 0xff)
      id += String.fromCharCode(reg & 0xff)
    }
    return id.trim()
  }

  set deviceId(id: string) {
    const clean = id.padEnd(32, '0')

    for (let i = 0; i < 16; i++) {
      const c1 = clean.charCodeAt(i * 2) || 0
      const c2 = clean.charCodeAt(i * 2 + 1) || 0
      this.deviceIdMemory[i] = (c1 << 8) | c2
    }

    this.emit('deviceIdChanged', this.deviceId)
  }

  read(type: RegisterType, address: number, quantity: number): number[] {
    if (
      type === 'holdingRegister' &&
      address >= ClientAddressSpace.deviceIdStart
    ) {
      const start = address - ClientAddressSpace.deviceIdStart
      return Array.from(this.deviceIdMemory.slice(start, start + quantity))
    }

    if (this.locked)
      throw new ModbusProtocolError(
        'slaveDeviceBusy',
        'Virtual Device access locked due to rate limiting'
      )
    return (
      this.getActiveDevice()?.read(type, address, quantity) ??
      new Array(quantity).fill(0)
    )
  }

  write(type: WritableRegisterType, address: number, values: number[]) {
    if (
      type === 'holdingRegister' &&
      address >= ClientAddressSpace.deviceIdStart
    ) {
      const start = address - ClientAddressSpace.deviceIdStart
      values.forEach((value, index) => {
        this.deviceIdMemory[start + index] = value
      })
      this.emit('deviceIdChanged', this.deviceId)
      return
    }

    if (this.locked)
      throw new ModbusProtocolError(
        'slaveDeviceBusy',
        'Virtual Device access locked due to rate limiting'
      )
    return this.getActiveDevice()?.write(type, address, values)
  }

  contains(address: number, quantity: number): boolean {
    if (address >= ClientAddressSpace.deviceIdStart) {
      return address + quantity <= ClientAddressSpace.deviceIdStart + 16
    }

    return (
      this.getActiveDevice()?.addressSpace.contains(address, quantity) ?? false
    )
  }
}
