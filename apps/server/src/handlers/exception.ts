import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'
import { ModbusBuffer } from '@/utils'
import { ModbusErrorCode } from '@/error'

export const exception = async (
  frame: ModbusMessage,
  client: ModbusClient,
  exceptionCode: number
) => {
  client.logger.warn(
    { functionCode: frame.functionCode, exceptionCode },
    'Returning Modbus Exception'
  )

  const buffer = ModbusBuffer.createResponse(2)
  buffer.setUint8(0, frame.functionCode + 0x80)
  buffer.setUint8(1, exceptionCode)

  return { response: frame.createResponse(buffer) }
}

export const IllegalFunctionCodeHandler: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  return exception(frame, client, ModbusErrorCode.illegalFunction)
}
