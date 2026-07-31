export function calculateModbusCrc(data: Uint8Array): number {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x0001) !== 0) {
        crc >>= 1
        crc ^= 0xa001
      } else {
        crc >>= 1
      }
    }
  }
  return crc
}
