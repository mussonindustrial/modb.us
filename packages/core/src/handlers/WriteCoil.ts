import { ModbusClient } from '../client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '../message'
import { ModbusBuffer } from '../utils'

export const WriteCoil: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const address = frame.pdu.getUint16(1)
  const rawValue = frame.pdu.getUint16(3)

  const value = rawValue === 0xff00
  await client.addressSpace.write('coil', address, [Number(value)])

  const buffer = ModbusBuffer.createResponse(5)
  buffer.setUint8(0, 5)
  buffer.setUint16(1, address)
  buffer.setUint16(3, rawValue)

  return { response: frame.createResponse(buffer) }
}
