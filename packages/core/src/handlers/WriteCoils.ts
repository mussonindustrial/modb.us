import { ModbusClient } from '../client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '../message'
import { ModbusBuffer } from '../utils'
import { ModbusProtocolError } from '../error'

export const WriteCoils: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const startAddress = frame.pdu.getUint16(1)
  const quantity = frame.pdu.getUint16(3)

  if (quantity < 1 || quantity > 1968) {
    throw new ModbusProtocolError('illegalDataValue', 'Invalid quantity')
  }

  const values: number[] = []
  for (let i = 0; i < quantity; i++) {
    const byteIndex = 6 + Math.floor(i / 8)
    const bitIndex = i % 8

    const byteValue = frame.pdu.getUint8(byteIndex)
    values.push((byteValue >> bitIndex) & 1)
  }

  await client.addressSpace.write('coil', startAddress, values)

  const buffer = ModbusBuffer.createResponse(5)
  buffer.setUint8(0, 15)
  buffer.setUint16(1, startAddress)
  buffer.setUint16(3, quantity)

  return { response: frame.createResponse(buffer) }
}
