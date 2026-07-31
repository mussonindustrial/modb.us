import { ModbusClient } from '../client'
import { ModbusProtocolError } from '../error'
import { ModbusMessageHandler, ModbusMessage } from '../message'

import { Diagnostics } from './Diagnostics'
import { exception, IllegalFunctionCodeHandler } from './exception'
import { MaskWriteRegister } from './MaskWriteRegister'
import { ReadCoils } from './ReadCoils'
import { ReadDiscreteInputs } from './ReadDiscreteInputs'
import { ReadHoldingRegisters } from './ReadHoldingRegisters'
import { ReadInputRegisters } from './ReadInputRegisters'
import { ReadWriteMultipleRegisters } from './ReadWriteMultipleRegisters'
import { ReportSlaveId } from './ReportSlaveId'
import { WriteHoldingRegister } from './WriteHoldingRegister'
import { WriteCoil } from './WriteCoil'
import { WriteCoils } from './WriteCoils'
import { WriteHoldingRegisters } from './WriteHoldingRegisters'

export * from './Diagnostics'
export * from './exception'
export * from './MaskWriteRegister'
export * from './ReadCoils'
export * from './ReadDiscreteInputs'
export * from './ReadHoldingRegisters'
export * from './ReadInputRegisters'
export * from './ReadWriteMultipleRegisters'
export * from './ReportSlaveId'
export * from './WriteHoldingRegister'
export * from './WriteCoil'
export * from './WriteHoldingRegisters'

const handlers = {
  1: ReadCoils,
  2: ReadDiscreteInputs,
  3: ReadHoldingRegisters,
  4: ReadInputRegisters,
  5: WriteCoil,
  6: WriteHoldingRegister,
  8: Diagnostics,
  15: WriteCoils,
  16: WriteHoldingRegisters,
  17: ReportSlaveId,
  22: MaskWriteRegister,
  23: ReadWriteMultipleRegisters,
  exception: IllegalFunctionCodeHandler,
}

export const ModbusMessageHandlerSet: ModbusMessageHandler = async (
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
