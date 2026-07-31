import { ModbusClient } from '../client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '../message'
import { ModbusBuffer } from '../utils'
import { ModbusProtocolError } from '../error'

export const ReadCoils: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const startAddress = frame.pdu.getUint16(1)
  const quantity = frame.pdu.getUint16(3)

  if (quantity < 1 || quantity > 2000) {
    throw new ModbusProtocolError(
      'illegalDataValue',
      `Quantity ${quantity} is out of bounds for Read Coils (1-2000)`
    )
  }

  const values = await client.addressSpace.read('coil', startAddress, quantity)

  const byteCount = Math.ceil(quantity / 8)
  const buffer = ModbusBuffer.createResponse(2 + byteCount)
  buffer.setUint8(0, 1)
  buffer.setUint8(1, byteCount)
  values.forEach((value, index) => {
    if (value) {
      const byteIndex = 2 + Math.floor(index / 8)
      const bitIndex = index % 8

      const currentByte = buffer.getUint8(byteIndex)
      buffer.setUint8(byteIndex, currentByte | (1 << bitIndex))
    }
  })

  return { response: frame.createResponse(buffer) }
}
