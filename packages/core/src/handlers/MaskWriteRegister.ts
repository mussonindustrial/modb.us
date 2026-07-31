import { ModbusClient } from '../client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '../message'
import { ModbusBuffer } from '../utils'

export const MaskWriteRegister: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const address = frame.pdu.getUint16(1)
  const andMask = frame.pdu.getUint16(3)
  const orMask = frame.pdu.getUint16(5)

  const result = await client.addressSpace.read('holdingRegister', address, 1)
  const currentValue = result[0]

  const newValue = (currentValue & andMask) | (orMask & ~andMask & 0xffff)

  await client.addressSpace.write('holdingRegister', address, [newValue])

  const buffer = ModbusBuffer.createResponse(7)
  buffer.setUint8(0, 22)
  buffer.setUint16(1, address)
  buffer.setUint16(3, andMask)
  buffer.setUint16(5, orMask)

  return { response: frame.createResponse(buffer) }
}
