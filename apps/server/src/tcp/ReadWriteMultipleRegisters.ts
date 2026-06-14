import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'

export const ReadWriteMultipleRegisters: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const readAddress = frame.getUint16(8)
  const readQuantity = frame.getUint16(10)

  const writeAddress = frame.getUint16(12)
  const writeQuantity = frame.getUint16(14)

  for (let i = 0; i < writeQuantity; i++) {
    const address = writeAddress + i
    const value = frame.raw.getUint16(17 + i * 2, false)
    client.addressSpace.write('holdingRegister', address, value)
  }

  const readByteCount = readQuantity * 2
  const response = new Uint8Array(9 + readByteCount)
  const view = new DataView(
    response.buffer,
    response.byteOffset,
    response.byteLength
  )

  view.setUint16(0, frame.transactionId, false)
  view.setUint16(2, frame.protocolId, false)
  view.setUint16(4, readByteCount + 3, false)
  view.setUint8(6, frame.unitId)
  view.setUint8(7, 23)
  view.setUint8(8, readByteCount)

  for (let i = 0; i < readQuantity; i++) {
    const value = client.addressSpace.read('holdingRegister', readAddress + i)
    view.setUint16(9 + i * 2, value, false)
  }

  return { response }
}
