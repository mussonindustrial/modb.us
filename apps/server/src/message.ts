import { ModbusClient } from '@/client'

export type ModbusResponse = {
  response: Uint8Array
}

export type ModbusFunctionCodeHandler = (
  frame: ModbusMessage,
  client: ModbusClient
) => Promise<ModbusResponse>

export type ModbusMessageHandler = (
  frame: ModbusMessage,
  client: ModbusClient
) => Promise<ModbusResponse>

export class ModbusMessage {
  constructor(readonly raw: DataView) {}

  static from(data: Uint8Array): ModbusMessage {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    return new ModbusMessage(view)
  }

  get transactionId() {
    return this.getUint16(0)
  }

  get protocolId() {
    return this.getUint16(2)
  }

  get unitId() {
    return this.getUint8(6)
  }

  get functionCode() {
    return this.getUint8(7)
  }

  getUint8(offset: number) {
    return this.raw.getUint8(offset)
  }

  getUint16(offset: number) {
    return this.raw.getUint16(offset, false)
  }
}
