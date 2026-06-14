import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'

export const ReportSlaveId: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage
) => {
  const idString = 'modb.us by Musson Industrial'
  const encoder = new TextEncoder()
  const additionalData = encoder.encode(idString)

  const byteCount = 2 + additionalData.length

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
  view.setUint8(7, 17)
  view.setUint8(8, byteCount)
  view.setUint8(9, 1)
  view.setUint8(10, 0xff)
  response.set(additionalData, 11)

  return { response }
}
