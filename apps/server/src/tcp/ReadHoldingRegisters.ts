import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'

export const ReadHoldingRegisters: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const start = frame.getUint16(8)
  const quantity = frame.getUint16(10)

  const byteCount = quantity * 2
  const response = new Uint8Array(9 + byteCount)
  const view = new DataView(
    response.buffer,
    response.byteOffset,
    response.byteLength
  )

  view.setUint16(0, frame.transactionId, false)
  view.setUint16(2, frame.protocolId, false)
  view.setUint16(4, byteCount + 3, false)
  view.setUint8(6, frame.unitId)
  view.setUint8(7, 3)
  view.setUint8(8, byteCount)

  const values = client.addressSpace.read('holdingRegister', start, quantity)
  values.forEach((value, index) => {
    view.setUint16(9 + index * 2, value, false)
  })

  return { response }
}
