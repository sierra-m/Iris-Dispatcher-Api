

export default class BinaryStream {
  /**
   * Store base buffer
   * @param {Buffer} buff
   */
  constructor (buff) {
    this.data = buff;
    this.pos = 0;
  }

  reset () {
    this.pos = 0;
  }

  seek (pos) {
    this.pos = pos;
    if (this.pos < 0) this.pos = 0;
    if (this.pos >= this.data.length) this.pos = this.data.length - 1;
  }

  readString (length) {
    this.pos += length;
    return this.data.subarray(this.pos - length, this.pos).toString('ascii');
  }

  /**
   * Parse a single byte as unsigned int
   * @returns {number}
   */
  uint1 () {
    this.pos += 1;
    return this.data.readUInt8(this.pos - 1)
  }

  /**
   * Parse two bytes as unsigned int
   * @param lsb
   * @returns {number}
   */
  uint2 (lsb) {
    this.pos += 2;
    if (lsb) {
      return this.data.readUInt16LE(this.pos - 2)
    }
    return this.data.readUInt16BE(this.pos - 2)
  }

  /**
   * Parse 4 bytes as unsigned int
   * @param lsb
   * @returns {number}
   */
  uint4 (lsb) {
    this.pos += 4;
    if (lsb) {
      return this.data.readUInt32LE(this.pos - 4)
    }
    return this.data.readUInt32BE(this.pos - 4)
  }

  /**
   * Parse 8 bytes as unsigned int
   * Returns bigint to cover possible overflow
   * @param lsb
   * @returns {bigint}
   */
  uint8 (lsb) {
    this.pos += 8;
    if (lsb) {
      return this.data.readBigUInt64LE(this.pos - 8)
    }
    return this.data.readBigUInt64BE(this.pos - 8)
  }

  *[Symbol.iterator] () {
    for (let i = 0; i < this.data.length; i++) {
      yield this.data.charCodeAt(i);
    }
  }
}

