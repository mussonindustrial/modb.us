import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'

export const ReadCoils: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const start = frame.getUint16(8)
  const quantity = frame.getUint16(10)

  const byteCount = Math.ceil(quantity / 8)
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
  view.setUint8(7, 1)
  view.setUint8(8, byteCount)

  const values = client.addressSpace.read('coil', start, quantity)
  values.forEach((value, index) => {
    if (value) {
      const byteIndex = 9 + Math.floor(index / 8)
      const bitIndex = index % 8
      const currentByte = view.getUint8(byteIndex)
      view.setUint8(byteIndex, currentByte | (1 << bitIndex))
    }
  })

  return { response }
}
