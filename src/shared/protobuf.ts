/** Minimal protobuf reader/writer for Google Authenticator migration payloads. */

export class ProtoReader {
  constructor(
    private buf: Uint8Array,
    private i = 0
  ) {}

  get offset(): number {
    return this.i
  }

  remaining(): number {
    return this.buf.length - this.i
  }

  readVarint(): number {
    let n = 0
    let shift = 0
    while (this.i < this.buf.length) {
      const b = this.buf[this.i++]
      n += (b & 0x7f) * 2 ** shift
      if ((b & 0x80) === 0) return n
      shift += 7
      if (shift > 35) throw new Error('Varint too long')
    }
    throw new Error('Unexpected end of protobuf')
  }

  readBytes(): Uint8Array {
    const len = this.readVarint()
    const slice = this.buf.slice(this.i, this.i + len)
    this.i += len
    return slice
  }

  readString(): string {
    return new TextDecoder().decode(this.readBytes())
  }

  skip(wireType: number): void {
    if (wireType === 0) this.readVarint()
    else if (wireType === 1) this.i += 8
    else if (wireType === 2) this.readBytes()
    else if (wireType === 5) this.i += 4
    else throw new Error(`Unknown wire type ${wireType}`)
  }
}

export class ProtoWriter {
  private chunks: number[] = []

  writeVarint(value: number): void {
    let n = value >>> 0
    while (n > 0x7f) {
      this.chunks.push((n & 0x7f) | 0x80)
      n >>>= 7
    }
    this.chunks.push(n)
  }

  writeTag(field: number, wire: number): void {
    this.writeVarint((field << 3) | wire)
  }

  writeBytes(field: number, bytes: Uint8Array): void {
    this.writeTag(field, 2)
    this.writeVarint(bytes.length)
    this.chunks.push(...bytes)
  }

  writeString(field: number, value: string): void {
    this.writeBytes(field, new TextEncoder().encode(value))
  }

  writeInt(field: number, value: number): void {
    this.writeTag(field, 0)
    this.writeVarint(value)
  }

  writeMessage(field: number, bytes: Uint8Array): void {
    this.writeBytes(field, bytes)
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.chunks)
  }
}

export interface MigrationOtp {
  secret: Uint8Array
  name: string
  issuer: string
  algorithm: number
  digits: number
  type: number
  counter: number
}

export function decodeMigrationPayload(bytes: Uint8Array): MigrationOtp[] {
  const reader = new ProtoReader(bytes)
  const out: MigrationOtp[] = []
  while (reader.remaining() > 0) {
    const tag = reader.readVarint()
    const field = tag >> 3
    const wire = tag & 7
    if (field === 1 && wire === 2) {
      out.push(decodeOtpParameters(reader.readBytes()))
    } else {
      reader.skip(wire)
    }
  }
  return out
}

function decodeOtpParameters(bytes: Uint8Array): MigrationOtp {
  const reader = new ProtoReader(bytes)
  const otp: MigrationOtp = {
    secret: new Uint8Array(),
    name: '',
    issuer: '',
    algorithm: 1,
    digits: 1,
    type: 2,
    counter: 0
  }
  while (reader.remaining() > 0) {
    const tag = reader.readVarint()
    const field = tag >> 3
    const wire = tag & 7
    if (field === 1 && wire === 2) otp.secret = reader.readBytes()
    else if (field === 2 && wire === 2) otp.name = reader.readString()
    else if (field === 3 && wire === 2) otp.issuer = reader.readString()
    else if (field === 4 && wire === 0) otp.algorithm = reader.readVarint()
    else if (field === 5 && wire === 0) otp.digits = reader.readVarint()
    else if (field === 6 && wire === 0) otp.type = reader.readVarint()
    else if (field === 7 && wire === 0) otp.counter = reader.readVarint()
    else reader.skip(wire)
  }
  return otp
}

export function encodeMigrationPayload(otps: MigrationOtp[]): Uint8Array {
  const root = new ProtoWriter()
  for (const otp of otps) {
    const w = new ProtoWriter()
    w.writeBytes(1, otp.secret)
    if (otp.name) w.writeString(2, otp.name)
    if (otp.issuer) w.writeString(3, otp.issuer)
    w.writeInt(4, otp.algorithm)
    w.writeInt(5, otp.digits)
    w.writeInt(6, otp.type)
    if (otp.counter) w.writeInt(7, otp.counter)
    root.writeMessage(1, w.toUint8Array())
  }
  root.writeInt(2, 1)
  return root.toUint8Array()
}
