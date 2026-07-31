import { ModbusClient } from '../client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '../message'
import { ModbusBuffer } from '../utils'
import { ModbusProtocolError } from '../error'

export const ReadHoldingRegisters: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const startAddress = frame.pdu.getUint16(1)
  const quantity = frame.pdu.getUint16(3)

  if (quantity < 1 || quantity > 125) {
    throw new ModbusProtocolError(
      'illegalDataValue',
      `Quantity ${quantity} is out of bounds for Read Holding Registers (1-125)`
    )
  }

  const values = await client.addressSpace.read(
    'holdingRegister',
    startAddress,
    quantity
  )

  const byteCount = quantity * 2
  const buffer = ModbusBuffer.createResponse(2 + byteCount)
  buffer.setUint8(0, 3)
  buffer.setUint8(1, byteCount)
  values.forEach((value, index) => {
    buffer.setUint16(2 + index * 2, value)
  })

  return { response: frame.createResponse(buffer) }
}
