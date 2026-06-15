import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'

export const WriteHoldingRegister: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const address = frame.getUint16(8)
  const value = frame.getUint16(10)

  client.addressSpace.write('holdingRegister', address, [value])

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
  view.setUint8(7, 6)
  view.setUint16(8, address, false)
  view.setUint16(10, value, false)

  return { response }
}
