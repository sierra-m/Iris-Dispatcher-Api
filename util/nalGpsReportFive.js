import moment from 'moment'
import BinaryStream from './binary'

/**
 * Decode NAS GPS Report 5
 * @param {BinaryStream} stream
 * @param {number} length
 * @returns {{satellites, altitude: *, motion: *, output_pins: *, latitude: *, ground_velocity: *, emergency: *, hdop: *, emergency_ack: *, fix: string, input_pins, vdop: *, course: (number|*), time, vertical_velocity: *, longitude: *}}
 */
const decodeNalGpsReport5 = (stream, length) => {
  /**
   * NAL base 10 extraction method
   * @param {bigint} extract_from
   * @param {bigint} starting_at
   * @returns {[bigint, bigint]}
   */
  const extract_value_after = (extract_from, starting_at) => {
    let num = extract_from / starting_at;
    extract_from = extract_from % starting_at;
    return [num, extract_from]
  };

  if (length < 30 || length > 99) {
    throw new SyntaxError(`Unexpected report length: ${length}`)
  }

  const verify = stream.uint1();

  if (verify !== 5) {
    throw new SyntaxError(`Unexpected verifier: ${verify}`)
  }

  const input_pins = stream.uint1();

  let location_block = stream.uint8(true);
  let time_block =     stream.uint8(true);
  let calc_block =     stream.uint8(true);
  //console.log(`calc_block: ${calc_block}`);

  let num2 = stream.uint2(true);

  let num3 = stream.uint1();
  let num4 = stream.uint1();

  let south, west;

  let value_after1, lng_degrees, lng_minutes, lng_minutes_thou, lat_degrees, lat_minutes, lat_minutes_thou;

  [south,            location_block] = extract_value_after(location_block, 10000000000000000000n);
  [value_after1,     location_block] = extract_value_after(location_block, 10000000000000000n);
  [lng_minutes,      location_block] = extract_value_after(location_block, 100000000000000n);
  [lng_minutes_thou, location_block] = extract_value_after(location_block, 100000000000n);
  [lat_degrees,      location_block] = extract_value_after(location_block, 1000000000n);
  [lat_minutes,      location_block] = extract_value_after(location_block, 10000000n);
  [lat_minutes_thou, location_block] = extract_value_after(location_block, 10000n);

  let num5 = Number(location_block);

  let falling, month, day, year, hour, minute, second, millis;

  [falling, time_block] = extract_value_after(time_block, 10000000000000000000n);
  falling = !!!falling;  // aka not the truthy value

  [month,  time_block] = extract_value_after(time_block, 100000000000000000n);
  [day,    time_block] = extract_value_after(time_block, 1000000000000000n);
  [year,   time_block] = extract_value_after(time_block, 100000000000n);
  [hour,   time_block] = extract_value_after(time_block, 1000000000n);
  [minute, time_block] = extract_value_after(time_block, 10000000n);
  [second, time_block] = extract_value_after(time_block, 100000n);
  [millis, time_block] = extract_value_after(time_block, 10000n);
  millis = millis * 100n;

  let num6 = Number(time_block);

  let below_sea, course, value_after15, value_after16, value_after17, value_after18;

  [below_sea,     calc_block] = extract_value_after(calc_block, 10000000000000000000n);
  //console.log(`below_sea: ${below_sea.toString()} calc_block: ${calc_block.toString()}`);
  below_sea = !!!below_sea;

  [course,        calc_block] = extract_value_after(calc_block, 100000000000000n);
  course = course / 100n;

  [value_after15, calc_block] = extract_value_after(calc_block, 10000000000000n);
  [value_after16, calc_block] = extract_value_after(calc_block, 100000000n);
  [value_after17, calc_block] = extract_value_after(calc_block, 10000000n);
  [value_after18, calc_block] = extract_value_after(calc_block, 100n);

  //console.log(`calc_block: ${calc_block.toString()}`);
  let output_pins = Number(calc_block % 64n);

  let num7 = Math.floor(num2 / 10000);
  let num8 = num2 % 10000;
  let satellites = Math.floor(num3 / 10);

  let num9 = num3 % 10;

  let flag4 = num4 & 1;
  let flag5 = (num4 & 2) === 2;
  let flag6 = (num4 & 4) === 4;
  let flag7 = (num4 & 8) === 8;

  let emergency = (num4 & 16) === 16;
  let motion =    (num4 & 32) === 32;

  let emergency_acknowledged = (num4 & 64) === 64;

  if (value_after1 < 200n) {
    west = false;
    lng_degrees = value_after1;
  } else {
    west = true;
    lng_degrees = value_after1 - 200n;
  }

  let time = moment.utc([Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Number(millis)]);

  let latitude = (Number(lat_degrees) + ((Number(lat_minutes) + (Number(lat_minutes_thou) / 1000)) / 60)) * (south ? -1 : 1);
  let longitude = (Number(lng_degrees) + ((Number(lng_minutes) + (Number(lng_minutes_thou) / 1000)) / 60)) * (west ? -1 : 1);

  let altitude = (Number(value_after16) / Math.pow(10, 5 - Number(value_after15))) * (below_sea ? -1 : 1);

  let ground_velocity = (Number(value_after18) / Math.pow(10, (5 - Number(value_after17))));
  course = Number(course / 100n);

  let vertical_velocity = (num9 * 10000 + num6) / Math.pow(10, 5 - num7) * (falling ? 1 : -1);

  let hdop = num5 / 100;
  let vdop = num8 / 100;

  let fix = flag6 ? 'valid3d' : (flag4 ? '2d' : (flag5 ? 'deadreckoning' : 'other'));
  if (-90 <= latitude <= 90 && -180 <= longitude <= 180) {
    return {
      time: time,
      latitude: latitude,
      longitude: longitude,
      altitude: altitude,
      ground_speed: ground_velocity,
      course: course,
      vertical_velocity: vertical_velocity,
      fix: fix,
      satellites: satellites,
      hdop: hdop,
      vdop: vdop,
      motion: motion,
      emergency: emergency,
      emergency_ack: emergency_acknowledged,
      input_pins: input_pins,
      output_pins: output_pins
    }
  } else {
    throw new SyntaxError('Location data is out of bounds');
  }
};

export default decodeNalGpsReport5;