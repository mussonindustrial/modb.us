import { ModbusClient } from '../client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '../message'
import { ModbusBuffer } from '../utils'

export const WriteHoldingRegister: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const address = frame.pdu.getUint16(1)
  const value = frame.pdu.getUint16(3)

  await client.addressSpace.write('holdingRegister', address, [value])

  const buffer = ModbusBuffer.createResponse(5)
  buffer.setUint8(0, 6)
  buffer.setUint16(1, address)
  buffer.setUint16(3, value)

  return { response: frame.createResponse(buffer) }
}
