import { GenericModbusMessage, ModbusMessage } from './message'

export interface ModbusFrameFactory {
  fromBuffer(data: Uint8Array): ModbusMessage
}

export const TcpFrameFactory: ModbusFrameFactory = {
  fromBuffer: (data) => GenericModbusMessage.fromTcp(data),
}

export const RtuFrameFactory: ModbusFrameFactory = {
  fromBuffer: (data) => GenericModbusMessage.fromRtu(data),
}
