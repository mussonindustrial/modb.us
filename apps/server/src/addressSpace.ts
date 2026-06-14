import { BitArray } from '@/utils'

export type RegisterType =
  | 'coil'
  | 'discreteInput'
  | 'holdingRegister'
  | 'inputRegister'

export type WritableRegisterType = Extract<
  RegisterType,
  'coil' | 'holdingRegister'
>

export type AddressSpace = {
  read(type: RegisterType, address: number): number
  write(type: RegisterType, address: number, value: number): void
  contains(address: number, length: number): boolean
}

export class AllocatedAddressSpace implements AddressSpace {
  coils: BitArray
  discreteInputs: BitArray
  holdingRegisters: Uint16Array<ArrayBuffer>
  inputRegisters: Uint16Array<ArrayBuffer>

  static readonly maxAddress: number = 999

  constructor() {
    this.coils = new BitArray(AllocatedAddressSpace.maxAddress)
    this.discreteInputs = new BitArray(AllocatedAddressSpace.maxAddress)
    this.holdingRegisters = new Uint16Array(AllocatedAddressSpace.maxAddress)
    this.inputRegisters = new Uint16Array(AllocatedAddressSpace.maxAddress)
  }

  read(type: RegisterType, address: number): number {
    switch (type) {
      case 'coil':
        return Number(this.coils.get(address))
      case 'discreteInput':
        return Number(this.discreteInputs.get(address))
      case 'holdingRegister':
        return this.holdingRegisters[address]
      case 'inputRegister':
        return this.inputRegisters[address]
      default:
        return 0
    }
  }

  write(type: WritableRegisterType, address: number, value: number) {
    switch (type) {
      case 'coil':
        this.coils.set(address, value === 1)
        break
      case 'holdingRegister': {
        this.holdingRegisters[address] = value
        break
      }
    }
  }

  contains(address: number, length: number): boolean {
    return address >= 0 && address + length <= AllocatedAddressSpace.maxAddress
  }
}
