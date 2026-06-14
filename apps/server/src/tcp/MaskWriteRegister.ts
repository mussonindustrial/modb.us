import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'

export const MaskWriteRegister: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const address = frame.getUint16(8)
  const andMask = frame.getUint16(10)
  const orMask = frame.getUint16(12)

  const currentValue = client.addressSpace.read('holdingRegister', address)

  const notAndMask = ~andMask & 0xffff
  const newValue = (currentValue & andMask) | (orMask & notAndMask)

  client.addressSpace.write('holdingRegister', address, newValue)

  const response = new Uint8Array(14)
  const view = new DataView(
    response.buffer,
    response.byteOffset,
    response.byteLength
  )

  view.setUint16(0, frame.transactionId, false)
  view.setUint16(2, frame.protocolId, false)
  view.setUint16(4, 8, false)
  view.setUint8(6, frame.unitId)
  view.setUint8(7, 22)
  view.setUint16(8, address, false)
  view.setUint16(10, andMask, false)
  view.setUint16(12, orMask, false)

  return { response }
}
