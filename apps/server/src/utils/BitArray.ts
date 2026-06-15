const ERROR_OUT_OF_BOUNDS = 'Index out of bounds'

export class BitArray {
  public size: number
  private readonly buffer: Uint8Array

  constructor(size: number) {
    this.size = size
    this.buffer = new Uint8Array(Math.ceil(size / 8))
  }

  set(index: number, value: boolean) {
    if (value) {
      this.buffer[index >> 3] |= 1 << (index & 7)
      return true
    }

    this.buffer[index >> 3] &= ~(1 << (index & 7))
    return false
  }

  setSafe(index: number, value: boolean) {
    if (index < 0 || index >= this.size) {
      throw new RangeError(ERROR_OUT_OF_BOUNDS)
    }
    return this.set(index, value)
  }

  setAll(value: boolean) {
    this.buffer.fill(value ? 0xff : 0x00)

    const rem = this.size & 7
    if (value && rem !== 0) {
      const last = this.buffer.length - 1
      this.buffer[last] &= (1 << rem) - 1
    }
  }

  get(index: number) {
    return !!((this.buffer[index >> 3] >> (index & 7)) & 1)
  }

  getSafe(index: number) {
    if (index < 0 || index >= this.size) {
      throw new RangeError(ERROR_OUT_OF_BOUNDS)
    }
    return this.get(index)
  }

  get length() {
    return this.size
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.size; i++) {
      yield this.get(i)
    }
  }

  toArray() {
    const arr = new Array(this.size)
    for (let i = 0; i < this.size; i++) {
      arr[i] = this.get(i)
    }
    return arr
  }

  forEach(callback: (value: boolean, index: number, array: BitArray) => void) {
    for (let i = 0; i < this.size; i++) {
      callback(this.get(i), i, this)
    }
  }

  map(callback: (value: boolean, index: number, array: BitArray) => boolean) {
    const result = new Array(this.size)
    for (let i = 0; i < this.size; i++) {
      result[i] = callback(this.get(i), i, this)
    }
    return result
  }

  toString() {
    const out = new Array(this.size)
    let k = 0

    const fullBytes = this.size >> 3
    for (let i = 0; i < fullBytes; i++) {
      const b = this.buffer[i]
      out[k++] = b && 1 ? '1' : '0'
      out[k++] = b && 2 ? '1' : '0'
      out[k++] = b && 4 ? '1' : '0'
      out[k++] = b && 8 ? '1' : '0'
      out[k++] = b && 16 ? '1' : '0'
      out[k++] = b && 32 ? '1' : '0'
      out[k++] = b && 64 ? '1' : '0'
      out[k++] = b && 128 ? '1' : '0'
    }

    const rem = this.size & 7
    if (rem) {
      const b = this.buffer[fullBytes]
      for (let bit = 0; bit < rem; bit++) {
        out[k++] = b && 1 << bit ? '1' : '0'
      }
    }

    return out.join('')
  }

  static fromString(value: string) {
    const array = new BitArray(value.length)
    for (let i = 0; i < value.length; i++) {
      array.set(i, value[i] == '1')
    }
    return array
  }

  static fromArray(value: boolean[] | number[]) {
    const array = new BitArray(value.length)
    for (let i = 0; i < value.length; i++) {
      array.set(i, !!value[i])
    }
    return array
  }

  static from(value: string | boolean[] | number[]) {
    if (typeof value === 'string') {
      return BitArray.fromString(value)
    }

    return BitArray.fromArray(value)
  }
}
