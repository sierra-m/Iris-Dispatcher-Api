import moment from 'moment'
import BinaryStream from './binary'
import decodeNalGpsReport5 from './nalGpsReportFive'


const HEADER_IEI = 1;
const PAYLOAD_IEI = 2;
const LOCATION_IEI = 3;
const CONFIRM_IEI = 5;

const payload_decoder = decodeNalGpsReport5;

/**
 * Decode the header to object
 * Not intended to be called standalone
 * @param {BinaryStream} stream
 * @returns {{data: *, length}}
 */
const decodeMOHeader = (stream) => {
  const header_length = stream.uint2();
  if (header_length !== 28) {
    throw new SyntaxError(`Unexpected header length: ${header_length}`)
  }

  const cdr_ref = stream.uint4();

  const imei = stream.readString(15);

  const session_status = stream.uint1();

  const momsn = stream.uint2();

  const mtmsn = stream.uint2();

  const time = stream.uint4();

  return {
    length: header_length,
    data: {
      cdr: cdr_ref,
      imei: imei,
      session: session_status,
      momsn: momsn,
      mtmsn: mtmsn,
      time: moment.utc(time, 'X')
    }
  }
};

/**
 * Decode payload to object
 * Not meant to be called standalone
 * @param {BinaryStream} stream
 * @returns {{data: *, length}}
 */
const decodeMOPayload = (stream) => {
  const payload_length = stream.uint2();
  if (payload_length > 1960) {
    throw new SyntaxError(`Unexpected payload length: ${payload_length}`);
  }

  const report = payload_decoder(stream, payload_length);

  return {
    length: payload_length,
    data: report
  }
};

/**
 * Decode location to object
 * Not intended to be called standalone
 * @param {BinaryStream} stream
 * @returns {{data: *, length}}
 */
const decodeMOLocation = (stream) => {
  const location_length = stream.uint2();
  if (location_length !== 11) {
    throw new SyntaxError(`Unexpected location length: ${location_length}`);
  }

  const direction = stream.uint1();
  const south = !!(direction & 0x02);
  const west = !!(direction & 0x01);

  const lat_degree = stream.uint1();
  const lat_minute = stream.uint2();

  const lng_degree = stream.uint1();
  const lng_minute = stream.uint2();

  const latitude = (lat_degree + lat_minute / 60000) * (south ? -1 : 1);
  const longitude = (lng_degree + lng_minute / 60000) * (west ? -1 : 1);

  const cep_radius = stream.uint4();

  return {
    length: location_length,
    data: {
      latitude: latitude,
      longitude: longitude,
      cep_radius: cep_radius
    }
  }
};

/**
 * Decode confirm to object
 * Not intended to be called standalone
 * @param {BinaryStream} stream
 * @returns {{data: *, length}}
 */
const decodeMOConfirm = (stream) => {
  const confirm_length = stream.uint2();
  if (confirm_length !== 1) {
    throw new SyntaxError(`Unexpected confirm length: ${confirm_length}`)
  }

  const confirm = !!stream.uint1();

  return {
    length: confirm_length,
    data: {
      confirm: confirm
    }
  }
};

/**
 * Decode MO data to object
 * @param data
 * @returns {{confirm: *, payload: *, header: *, location: *}}
 */
const decodeMOData = (data) => {
  const stream = new BinaryStream(data);

  const version = stream.uint1();

  let message_length = stream.uint2();
  //console.log(`Message length: ${message_length}`);

  let header = null;
  let payload = null;
  let location = null;
  let confirm = null;

  while (message_length > 0) {
    let iei = stream.uint1();

    message_length -= 3;

    let result = {};

    switch (iei) {
      case HEADER_IEI:
        //console.log('header iei');
        result = decodeMOHeader(stream);
        header = result.data;
        break;
      case PAYLOAD_IEI:
        //console.log('payload iei');
        result = decodeMOPayload(stream);
        payload = result.data;
        break;
      case LOCATION_IEI:
        //console.log('location iei');
        result = decodeMOLocation(stream);
        location = result.data;
        break;
      case CONFIRM_IEI:
        //console.log('confirm iei');
        result = decodeMOConfirm(stream);
        confirm = result.data;
        break;
      default:
        throw new SyntaxError(`Unexpected IEI: ${iei}`)
    }
    message_length -= result.length;
  }

  return {
    header: header,
    payload: payload,
    location: location,
    confirm: confirm
  }
};

export default decodeMOData;