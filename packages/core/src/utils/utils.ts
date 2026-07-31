export function vdidToRegisters(vdid: string): Uint16Array {
  const cleanVdid = vdid.padEnd(32, '0').substring(0, 32)
  const registers = new Uint16Array(16)

  for (let i = 0; i < 16; i++) {
    const charHigh = cleanVdid.charCodeAt(i * 2) || 0
    const charLow = cleanVdid.charCodeAt(i * 2 + 1) || 0

    registers[i] = (charHigh << 8) | (charLow & 0xff)
  }

  return registers
}
