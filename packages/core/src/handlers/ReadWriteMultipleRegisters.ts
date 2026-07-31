import { ModbusClient } from '../client'
import { ModbusFunctionCodeHandler, ModbusMessage } from '../message'
import { ModbusBuffer } from '../utils'
import { ModbusProtocolError } from '../error'

export const ReadWriteMultipleRegisters: ModbusFunctionCodeHandler = async (
  frame: ModbusMessage,
  client: ModbusClient
) => {
  const readAddress = frame.pdu.getUint16(1)
  const readQuantity = frame.pdu.getUint16(3)

  const writeAddress = frame.pdu.getUint16(5)
  const writeQuantity = frame.pdu.getUint16(7)
  const writeByteCount = frame.pdu.getUint8(9)

  if (writeByteCount !== writeQuantity * 2) {
    throw new ModbusProtocolError(
      'illegalDataValue',
      'Write byte count does not match write quantity'
    )
  }

  client.logger.info({ writeQuantity, writeByteCount, writeAddress })

  const writeValues = new Array(writeQuantity).fill(0)
  for (let i = 0; i < writeQuantity; i++) {
    writeValues[i] = frame.pdu.getUint16(10 + i * 2)
  }

  await client.addressSpace.write('holdingRegister', writeAddress, writeValues)
  const values = await client.addressSpace.read(
    'holdingRegister',
    readAddress,
    readQuantity
  )

  const readByteCount = readQuantity * 2
  const buffer = ModbusBuffer.createResponse(2 + readByteCount)
  buffer.setUint8(0, 23)
  buffer.setUint8(1, readByteCount)
  values.forEach((value, index) => {
    buffer.setUint16(2 + index * 2, value)
  })

  return { response: frame.createResponse(buffer) }
}
