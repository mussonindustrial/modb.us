export class ModbusBuffer {
  private view: DataView

  constructor(public readonly raw: Uint8Array) {
    this.view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
  }

  static createResponse(size: number): ModbusBuffer {
    return new ModbusBuffer(new Uint8Array(size))
  }

  get length() {
    return this.raw.byteLength
  }

  getUint8(offset: number) {
    return this.view.getUint8(offset)
  }

  getUint16(offset: number, littleEndian = false) {
    return this.view.getUint16(offset, littleEndian)
  }

  setUint8(offset: number, value: number) {
    this.view.setUint8(offset, value)
  }

  setUint16(offset: number, value: number, littleEndian = false) {
    this.view.setUint16(offset, value, littleEndian)
  }

  slice(offset: number, length?: number): ModbusBuffer {
    const end = length !== undefined ? offset + length : undefined
    return new ModbusBuffer(this.raw.subarray(offset, end))
  }
}
