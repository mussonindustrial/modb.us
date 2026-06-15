import { calculateModbusCrc } from '@/message/crc'
import { ModbusBuffer } from '@/utils'

export interface ModbusHeader {
  createResponse(buffer: ModbusBuffer): Uint8Array
}

export class ModbusTcpHeader implements ModbusHeader {
  constructor(readonly buffer: ModbusBuffer) {}

  get transactionId() {
    return this.buffer.getUint16(0)
  }
  get protocolId() {
    return this.buffer.getUint16(2)
  }
  get length() {
    return this.buffer.getUint16(4)
  }
  get unitId() {
    return this.buffer.getUint8(6)
  }

  createResponse(buffer: ModbusBuffer): Uint8Array {
    const response = new Uint8Array(7 + buffer.length)
    const view = new DataView(response.buffer)

    view.setUint16(0, this.transactionId, false)
    view.setUint16(2, this.protocolId, false)
    view.setUint16(4, buffer.length + 1, false)
    view.setUint8(6, this.unitId)

    response.set(buffer.raw, 7)
    return response
  }
}

export class ModbusRtuHeader implements ModbusHeader {
  constructor(
    readonly buffer: ModbusBuffer,
    readonly crc: number
  ) {}

  get slaveId() {
    return this.buffer.getUint8(0)
  }

  createResponse(buffer: ModbusBuffer): Uint8Array {
    const response = new Uint8Array(1 + buffer.length + 2)
    const view = new DataView(response.buffer)

    view.setUint8(0, this.slaveId)
    response.set(buffer.raw, 1)

    const crcArea = response.subarray(0, 1 + buffer.length)
    const crc = calculateModbusCrc(crcArea)
    view.setUint16(response.byteLength - 2, crc, true)

    return response
  }
}
