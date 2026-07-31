import { ModbusHeader, ModbusRtuHeader, ModbusTcpHeader } from './header'
import { ModbusBuffer } from '../utils'

export type ModbusMessage = GenericModbusMessage<
  ModbusTcpHeader | ModbusRtuHeader
>

export class GenericModbusMessage<THeader extends ModbusHeader> {
  header: THeader
  pdu: ModbusBuffer

  private constructor(
    readonly buffer: ModbusBuffer,
    header: THeader,
    pduOffset: number,
    pduLength: number
  ) {
    this.header = header
    this.pdu = buffer.slice(pduOffset, pduLength)
  }

  static fromTcp(data: Uint8Array): GenericModbusMessage<ModbusTcpHeader> {
    const buffer = new ModbusBuffer(data)
    const headerBuffer = buffer.slice(0, 7)
    const header = new ModbusTcpHeader(headerBuffer)
    return new GenericModbusMessage(buffer, header, 7, header.length - 1)
  }

  static fromRtu(data: Uint8Array): GenericModbusMessage<ModbusRtuHeader> {
    const buffer = new ModbusBuffer(data)
    const headerBuffer = buffer.slice(0, 1)
    const crc = buffer.getUint16(buffer.length - 2, true)
    const header = new ModbusRtuHeader(headerBuffer, crc)
    return new GenericModbusMessage(buffer, header, 1, buffer.length - 3)
  }

  get functionCode() {
    return this.pdu.getUint8(0)
  }

  createResponse(buffer: ModbusBuffer): Uint8Array {
    return this.header.createResponse(buffer)
  }
}
