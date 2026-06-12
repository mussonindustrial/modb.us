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
  coils: Uint8Array<ArrayBuffer>
  discreteInputs: Uint8Array<ArrayBuffer>
  holdingRegisters: Uint16Array<ArrayBuffer>
  inputRegisters: Uint16Array<ArrayBuffer>

  maxAddress: number = 999

  constructor() {
    this.coils = new Uint8Array(999)
    this.discreteInputs = new Uint8Array(999)
    this.holdingRegisters = new Uint16Array(999)
    this.inputRegisters = new Uint16Array(999)
  }

  read(type: RegisterType, address: number): number {
    switch (type) {
      case 'coil':
        return this.coils[address]
      case 'discreteInput':
        return this.discreteInputs[address]
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
        this.coils[address] = value
        break
      case 'holdingRegister': {
        this.holdingRegisters[address] = value
        break
      }
    }
  }

  contains(address: number, length: number): boolean {
    return address >= 0 && address + length <= this.maxAddress
  }
}
