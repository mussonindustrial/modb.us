import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'

export const WriteHoldingRegisters: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const start = frame.getUint16(8)
  const quantity = frame.getUint16(10)

  for (let i = 0; i < quantity; i++) {
    const address = start + i
    const value = frame.raw.getUint16(13 + i * 2, false)
    client.addressSpace.write('holdingRegister', address, value)
  }

  const response = new Uint8Array(12)
  const view = new DataView(
    response.buffer,
    response.byteOffset,
    response.byteLength
  )

  view.setUint16(0, frame.transactionId, false)
  view.setUint16(2, frame.protocolId, false)
  view.setUint16(4, 6, false)
  view.setUint8(6, frame.unitId)
  view.setUint8(7, 16)
  view.setUint16(8, start, false)
  view.setUint16(10, quantity, false)

  return { response }
}
