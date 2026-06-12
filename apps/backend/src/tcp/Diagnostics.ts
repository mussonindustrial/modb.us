import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'
import { exception, IllegalFunctionCodeHandler } from '@/tcp/exception'
import { ModbusErrorCode } from '@/error'

const ReturnQueryData = async (frame: ModbusMessage) => {
  const remainingBytes = frame.getUint16(4)
  const dataLength = remainingBytes - 4
  const response = new Uint8Array(6 + remainingBytes)
  const view = new DataView(
    response.buffer,
    response.byteOffset,
    response.byteLength
  )

  view.setUint16(0, frame.transactionId, false)
  view.setUint16(2, frame.protocolId, false)
  view.setUint16(4, remainingBytes, false)
  view.setUint8(6, frame.unitId)

  view.setUint8(7, 8)
  view.setUint16(8, 0, false)

  for (let i = 0; i < dataLength; i++) {
    const dataByte = frame.raw.getUint8(10 + i)
    view.setUint8(10 + i, dataByte)
  }

  return { response }
}

const handlers = {
  0: ReturnQueryData,
  exception: IllegalFunctionCodeHandler,
}

export const Diagnostics: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const subFunction = frame.getUint16(8)

  const handler = handlers[subFunction]
  if (!handler) {
    return exception(frame, client, ModbusErrorCode.illegalDataValue)
  }

  return await handler(frame, client)
}
