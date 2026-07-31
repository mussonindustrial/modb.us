import { ModbusFunctionCodeHandler, ModbusMessage } from '../message'
import { ModbusBuffer } from '../utils'

export const ReportSlaveId: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage
) => {
  const encoder = new TextEncoder()
  const additionalData = encoder.encode('modb.us by Musson Industrial')

  const byteCount = 3 + additionalData.length
  const buffer = ModbusBuffer.createResponse(2 + byteCount)
  buffer.setUint8(0, 17)
  buffer.setUint8(1, byteCount)
  buffer.setUint8(2, 1)
  buffer.setUint8(3, 0xff)
  buffer.raw.set(additionalData, 4)

  return { response: frame.createResponse(buffer) }
}
