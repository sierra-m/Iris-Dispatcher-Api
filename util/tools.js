
/* Represents a simple ID that rotates on a set of `total` size */
class RotaryID {
  /**
   * Takes a set size to rotate through
   * @param {number} total
   */
  constructor (total) {
    this.id = 0;
    this.total = total;
  }

  /**
   * Generates and returns next id
   * @returns {number}
   */
  generate () {
    this.id = (this.id + 1) % this.total;
    return this.id;
  }

  /**
   * Returns current id
   * @returns {number}
   */
  current () {
    return this.id;
  }

  /**
   * Returns set-correct id after given id
   * @param id
   * @returns {number}
   */
  after (id) {
    return (id + 1) % this.total;
  }
}

class PacketLog {
  constructor (length, enabled) {
    this.packetLog = [];
    this.length = length;
    this.rotaryID = new RotaryID(length + 1);
    this.logEnabled = enabled;
  }

  /**
   * Log a packet for the user to see. Each packet
   * gets a unique ID to allow use of /update endpoint
   * @param {object} packet
   */
  logPacket (packet) {
    packet['id'] = this.rotaryID.generate();
    this.packetLog.push(packet);
    if (this.packetLog.length > this.length) {
      this.packetLog.shift();
    }
  }

  enable (state) {
    this.logEnabled = state;
  }

  isEnabled () {
    return this.logEnabled;
  }

  toJSON () {
    return this.packetLog;
  }

  presentIDs () {
    return this.packetLog.map(x => x.id);
  }

  subLog (subIDs) {
    return this.packetLog.reduce((result, current) => {
      if (subIDs.includes(current.id)) result.push(current);
      return result;
    }, []);
  }
}

export {RotaryID, PacketLog}