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
