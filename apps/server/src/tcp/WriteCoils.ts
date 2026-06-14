import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'

export const WriteCoils: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const start = frame.getUint16(8)
  const quantity = frame.getUint16(10)

  for (let i = 0; i < quantity; i++) {
    const address = start + i

    const byteIndex = 13 + Math.floor(i / 8)
    const bitIndex = i % 8

    const byteValue = frame.raw.getUint8(byteIndex)
    const isOn = ((byteValue >> bitIndex) & 1) === 1

    client.addressSpace.write('coil', address, Number(isOn))
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
  view.setUint8(7, 15)
  view.setUint16(8, start, false)
  view.setUint16(10, quantity, false)

  return { response }
}
