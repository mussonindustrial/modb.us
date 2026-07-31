export const ModbusErrorCode = {
  illegalFunction: 1,
  illegalDataAddress: 2,
  illegalDataValue: 3,
  slaveDeviceFailure: 4,
  slaveDeviceBusy: 6,
}

export class ModbusProtocolError extends Error {
  constructor(
    public key: keyof typeof ModbusErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'ModbusProtocolError'
  }

  get errorCode() {
    return ModbusErrorCode[this.key]
  }
}
