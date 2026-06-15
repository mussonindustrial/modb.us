import { ModbusClient } from '@/client'
import { ModbusMessage } from '@/message/message'

export type ModbusResponse = {
  response: Uint8Array
}

export type ModbusMessageHandler = (
  frame: ModbusMessage,
  client: ModbusClient
) => Promise<ModbusResponse>

export type ModbusFunctionCodeHandler = ModbusMessageHandler
