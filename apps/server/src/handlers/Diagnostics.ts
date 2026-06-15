import { ModbusClient } from '@/client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '@/message'
import { ModbusBuffer } from '@/utils'
import { ModbusProtocolError } from '@/error'

const ReturnQueryData: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage
) => {
  const dataLength = frame.pdu.raw.byteLength - 3
  const buffer = ModbusBuffer.createResponse(frame.pdu.raw.byteLength)

  buffer.setUint8(0, 8)
  buffer.setUint16(1, 0)

  for (let i = 0; i < dataLength; i++) {
    buffer.setUint8(3 + i, frame.pdu.getUint8(3 + i))
  }

  return { response: frame.createResponse(buffer) }
}

const subFunctionHandlers: Record<number, ModbusFunctionCodeHandler> = {
  0: ReturnQueryData,
}

export const Diagnostics: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const subFunction = frame.pdu.getUint16(1)

  const handler = subFunctionHandlers[subFunction]
  if (!handler) {
    throw new ModbusProtocolError(
      'illegalDataValue',
      'Unsupported sub-function'
    )
  }

  return await handler(frame, client)
}
