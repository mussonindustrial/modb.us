export class ModbusFrame {
  constructor(readonly raw: DataView) {}

  get transactionId() {
    return this.getUint16(0)
  }

  get protocolId() {
    return this.getUint16(2)
  }

  get unitId() {
    return this.getUint8(6)
  }

  get functionCode() {
    return this.getUint8(7)
  }

  getUint16(offset: number) {
    return this.raw.getUint16(offset, false)
  }

  getUint8(offset: number) {
    return this.raw.getUint8(offset)
  }

  static from(data: Uint8Array): ModbusFrame {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    return new ModbusFrame(view)
  }
}
