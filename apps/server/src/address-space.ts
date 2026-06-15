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
  read(type: RegisterType, address: number, quantity: number): Promise<number[]>
  write(type: RegisterType, address: number, values: number[]): Promise<void>
  contains(address: number, length: number): Promise<boolean>
}

export class InMemoryAddressSpace implements AddressSpace {
  coils: BitArray
  discreteInputs: BitArray
  holdingRegisters: Uint16Array<ArrayBuffer>
  inputRegisters: Uint16Array<ArrayBuffer>

  static readonly maxAddress: number = 999

  constructor() {
    this.coils = new BitArray(InMemoryAddressSpace.maxAddress)
    this.discreteInputs = new BitArray(InMemoryAddressSpace.maxAddress)
    this.holdingRegisters = new Uint16Array(InMemoryAddressSpace.maxAddress)
    this.inputRegisters = new Uint16Array(InMemoryAddressSpace.maxAddress)
  }

  async read(
    type: RegisterType,
    address: number,
    quantity: number
  ): Promise<number[]> {
    const values = new Array(quantity)

    switch (type) {
      case 'coil': {
        for (let i = 0; i < quantity; i++) {
          values[i] = Number(this.coils.get(address + i))
        }
        break
      }
      case 'discreteInput': {
        for (let i = 0; i < quantity; i++) {
          values[i] = Number(this.discreteInputs.get(address + i))
        }
        break
      }
      case 'holdingRegister': {
        for (let i = 0; i < quantity; i++) {
          values[i] = this.holdingRegisters[address + i]
        }
        break
      }
      case 'inputRegister': {
        for (let i = 0; i < quantity; i++) {
          values[i] = this.inputRegisters[address + i]
        }
        break
      }
      default: {
        for (let i = 0; i < quantity; i++) {
          values[i] = 0
        }
      }
    }

    return values
  }

  async write(type: WritableRegisterType, address: number, values: number[]) {
    switch (type) {
      case 'coil':
        values.forEach((value, index) =>
          this.coils.set(address + index, value === 1)
        )
        break
      case 'holdingRegister': {
        values.forEach(
          (value, index) => (this.holdingRegisters[address + index] = value)
        )
        break
      }
    }
  }

  async contains(address: number, length: number): Promise<boolean> {
    return address >= 0 && address + length <= InMemoryAddressSpace.maxAddress
  }
}
