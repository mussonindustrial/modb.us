import { ModbusClient } from '@/client'
import { ModbusProtocolError } from '@/error'
import { ModbusMessageHandler, ModbusMessage } from '@/message'

import { exception, IllegalFunctionCodeHandler } from './exception'
import { ReadHoldingRegister } from './readHoldingRegister'
import { WriteHoldingRegister } from './writeHoldingRegister'
import { WriteHoldingRegisters } from './writeHoldingRegisters'

export * from './exception'
export * from './readHoldingRegister'
export * from './writeHoldingRegister'
export * from './writeHoldingRegisters'

const handlers = {
  3: ReadHoldingRegister,
  6: WriteHoldingRegister,
  16: WriteHoldingRegisters,
  exception: IllegalFunctionCodeHandler,
}

export const ModbusTCPMessageHandler: ModbusMessageHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  try {
    const handler =
      handlers[frame.functionCode as keyof typeof handlers] ??
      handlers.exception
    return await handler(frame, client)
  } catch (error) {
    if (error instanceof ModbusProtocolError) {
      client.logger.warn(
        { err: error.message, code: error.errorCode },
        'Modbus protocol exception triggered'
      )
      return exception(frame, client, error.errorCode)
    }
    client.logger.error(
      { err: error },
      'Unhandled internal server error during Modbus processing'
    )
    throw error
  }
}
