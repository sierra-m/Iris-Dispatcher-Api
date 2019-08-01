import moment from 'moment'

/**
 * Shorthand to check for defined
 * @param thing
 * @returns {boolean}
 */

export default class FlightPoint {
  /*
  * Represents one frame in time/space from a flight
  *
  */
  constructor(packet) {
    this.datetime = packet.time;
    this.latitude = packet.latitude;
    this.longitude = packet.longitude;
    this.altitude = packet.altitude;
    this.vertical_velocity = packet.vertical_velocity;
    this.ground_speed = packet.ground_speed;
    this.satellites = packet.satellites;
    this.imei = packet.imei;
    this.output_pins = packet.output_pins;
    this.input_pins = packet.input_pins;

    /*if (defined(this.datetime) && this.datetime !== null) {
      this.datetime = moment.utc(this.datetime, 'YYYY-MM-DD[T]HH:mm:ss.S[Z]')
    }*/
  }
}