import {
  AddressSpace,
  RegisterType,
  WritableRegisterType,
} from './address-space'
import { ModbusClient } from './client'

export type VirtualDeviceId = string

export interface VirtualDevice {
  readonly id: VirtualDeviceId
  addressSpace: AddressSpace
  read(type: RegisterType, address: number, quantity: number): Promise<number[]>
  write(
    type: WritableRegisterType,
    address: number,
    values: number[]
  ): Promise<void>
  touch(): Promise<void>
  incrementConnections(): Promise<void>
  decrementConnections(): Promise<void>
}

export interface VirtualDeviceManager {
  getOrCreate(id: VirtualDeviceId): Promise<VirtualDevice>
  createClient(): Promise<ModbusClient>
}
