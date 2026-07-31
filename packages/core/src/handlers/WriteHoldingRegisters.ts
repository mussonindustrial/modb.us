import { ModbusClient } from '../client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '../message'
import { ModbusBuffer } from '../utils'
import { ModbusProtocolError } from '../error'

export const WriteHoldingRegisters: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const startAddress = frame.pdu.getUint16(1)
  const quantity = frame.pdu.getUint16(3)
  const byteCount = frame.pdu.getUint8(5)

  if (quantity < 1 || quantity > 123 || byteCount !== quantity * 2) {
    throw new ModbusProtocolError(
      'illegalDataValue',
      'Invalid quantity or byte count'
    )
  }

  const values: number[] = []
  for (let i = 0; i < quantity; i++) {
    values.push(frame.pdu.getUint16(6 + i * 2))
  }

  await client.addressSpace.write('holdingRegister', startAddress, values)

  const buffer = ModbusBuffer.createResponse(5)
  buffer.setUint8(0, 16)
  buffer.setUint16(1, startAddress)
  buffer.setUint16(3, quantity)

  return { response: frame.createResponse(buffer) }
}
