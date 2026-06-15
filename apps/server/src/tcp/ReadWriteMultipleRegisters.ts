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

  const writeValues = new Array(writeQuantity).fill(0)
  for (let i = 0; i < writeQuantity; i++) {
    writeValues[i] = frame.raw.getUint16(17 + i * 2, false)
  }
  client.addressSpace.write('holdingRegister', writeAddress, writeValues)

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

  const values = client.addressSpace.read(
    'holdingRegister',
    readAddress,
    readQuantity
  )
  values.forEach((value, index) => {
    view.setUint16(9 + index * 2, value, false)
  })

  return { response }
}
