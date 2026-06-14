import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'

export const exception = async (
  frame: ModbusMessage,
  client: ModbusClient,
  exceptionCode: number
) => {
  client.logger.warn(
    { functionCode: frame.functionCode, exceptionCode },
    'Returning Modbus Exception'
  )

  const response = new Uint8Array(9)
  const view = new DataView(
    response.buffer,
    response.byteOffset,
    response.byteLength
  )

  view.setUint16(0, frame.transactionId, false)
  view.setUint16(2, frame.protocolId, false)
  view.setUint16(4, 3, false)
  view.setUint8(6, frame.unitId)
  view.setUint8(7, frame.functionCode + 0x80)
  view.setUint8(8, exceptionCode)

  return { response }
}

export const IllegalFunctionCodeHandler: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  return exception(frame, client, 1)
}
