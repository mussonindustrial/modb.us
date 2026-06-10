import { ModbusFrame } from './frame'
import { ModbusClientSocket } from './virtualDevice'

export const ModbusErrorCodes = {
  illegalFunction: 1,
  illegalDataAddress: 2,
  illegalDataValue: 3,
  slaveDeviceFailure: 4,
}

const SWITCHBOARD_START_ADDRESS = 65520
const MAX_ADDRESS = 65535

type ModbusResponse = {
  response: Uint8Array
}

type ModbusFunctionCodeHandler = (
  frame: ModbusFrame,
  client: ModbusClientSocket
) => Promise<ModbusResponse>

const FC3Handler: ModbusFunctionCodeHandler = async (
  frame: ModbusFrame,
  client: ModbusClientSocket
) => {
  if (!client.activeVirtualDevice) {
    return exception(frame, client, ModbusErrorCodes.slaveDeviceFailure)
  }

  const start = frame.getUint16(8)
  const quantity = frame.getUint16(10)

  if (quantity < 1 || start + quantity > MAX_ADDRESS + 1) {
    return exception(frame, client, ModbusErrorCodes.illegalDataAddress)
  }

  const byteCount = quantity * 2
  const response = new Uint8Array(9 + byteCount)
  const view = new DataView(
    response.buffer,
    response.byteOffset,
    response.byteLength
  )

  view.setUint16(0, frame.transactionId, false)
  view.setUint16(2, frame.protocolId, false)
  view.setUint16(4, byteCount + 3, false)
  view.setUint8(6, frame.unitId)
  view.setUint8(7, 3)
  view.setUint8(8, byteCount)

  for (let i = 0; i < quantity; i++) {
    const address = start + i
    if (address >= SWITCHBOARD_START_ADDRESS && address <= 65535) {
      const value =
        client.switchboardRegisters[address - SWITCHBOARD_START_ADDRESS]
      client.logger.trace({ address, value }, 'Read switchboard register')
      view.setUint16(9 + i * 2, value, false)
    } else {
      view.setUint16(
        9 + i * 2,
        client.activeVirtualDevice!.read(address),
        false
      )
    }
  }

  return { response }
}

const FC6Handler: ModbusFunctionCodeHandler = async (
  frame: ModbusFrame,
  client: ModbusClientSocket
) => {
  if (!client.activeVirtualDevice) {
    return exception(frame, client, ModbusErrorCodes.slaveDeviceFailure)
  }

  const address = frame.getUint16(8)
  const value = frame.getUint16(10)

  if (address > MAX_ADDRESS) {
    return exception(frame, client, ModbusErrorCodes.illegalDataAddress)
  }

  client.logger.trace({ address, value }, 'Handling FC6 Write Single Register')

  if (address >= SWITCHBOARD_START_ADDRESS && address <= 65535) {
    client.logger.trace({ address, value }, 'Write to switchboard register')
    client.switchboardRegisters[address - SWITCHBOARD_START_ADDRESS] = value
    await client.maybeSwitchVirtualDevice()
  } else {
    client.activeVirtualDevice!.write(address, value)
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
  view.setUint8(7, 6)
  view.setUint16(8, address, false)
  view.setUint16(10, value, false)

  return { response }
}

const FC16Handler: ModbusFunctionCodeHandler = async (
  frame: ModbusFrame,
  client: ModbusClientSocket
) => {
  if (!client.activeVirtualDevice) {
    return exception(frame, client, ModbusErrorCodes.slaveDeviceFailure)
  }

  const start = frame.getUint16(8)
  const quantity = frame.getUint16(10)

  if (quantity < 1 || start + quantity > MAX_ADDRESS + 1) {
    return exception(frame, client, ModbusErrorCodes.illegalDataAddress)
  }

  client.logger.trace(
    { start, quantity },
    'Handling FC16 Write Multiple Registers'
  )

  let sessionChanged = false

  for (let i = 0; i < quantity; i++) {
    const address = start + i
    const value = frame.raw.getUint16(13 + i * 2, false)

    if (address >= SWITCHBOARD_START_ADDRESS && address <= 65535) {
      client.logger.trace({ address, value }, 'Write to switchboard register')
      client.switchboardRegisters[address - SWITCHBOARD_START_ADDRESS] = value
      sessionChanged = true
    } else {
      client.activeVirtualDevice!.write(address, value)
    }
  }

  if (sessionChanged) {
    await client.maybeSwitchVirtualDevice()
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
  view.setUint8(7, 16)
  view.setUint16(8, start, false)
  view.setUint16(10, quantity, false)

  return { response }
}

const exception = async (
  frame: ModbusFrame,
  client: ModbusClientSocket,
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
  view.setUint8(7, frame.functionCode)
  view.setUint8(8, exceptionCode)

  return { response }
}

const IllegalFunctionCodeHandler: ModbusFunctionCodeHandler = async (
  frame: ModbusFrame,
  client: ModbusClientSocket
) => {
  return exception(frame, client, 1)
}

export const ModbusFunctionCodeHandlers = {
  3: FC3Handler,
  6: FC6Handler,
  16: FC16Handler,
  exception: IllegalFunctionCodeHandler,
}
