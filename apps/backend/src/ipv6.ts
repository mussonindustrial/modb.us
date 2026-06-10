import crypto from 'crypto'

export type Ipv6Address = string

export function generateIpv6Suffix(): string {
  let blocks: string[] = []

  // Re-roll if any block evaluates to '0' to prevent the OS
  // from applying '::' compression, guaranteeing strict string equality.
  while (blocks.length !== 4 || blocks.includes('0')) {
    blocks = crypto
      .randomBytes(8)
      .toString('hex')
      .match(/.{4}/g)!
      // Parse as hex to drop leading zeros, then stringify back to hex
      .map((block) => parseInt(block, 16).toString(16))
  }

  return blocks.join(':')
}
