import express from 'express'
import FlightPoint from '../util/flight'
import { PacketLog } from '../util/tools'
import Net from 'net'
import decodeMOData from '../util/shortburst'
import { MIN_SATELLITES, LOG_LENGTH, GAIA_API_KEY } from '../config'
import packetsRouter from './packets'
import connectedRouter from './connected'
import updateRouter from './update'
import Logger from '../util/logging'

const GAIA_URL = `http://127.0.0.1:3001/assign?key=${GAIA_API_KEY}`;
const router = express.Router();
const packetLog = new PacketLog(LOG_LENGTH, true);
const logger = new Logger('incoming-sbd', 10);

const attachLog = async (req, res, next) => {
  req.packetLog = packetLog;
  next();
};

router.use('/connected', attachLog, connectedRouter);
router.use('/packets', attachLog, packetsRouter);
router.use('/update', attachLog, updateRouter);


/**
 * Determine whether to save point
 * @param {FlightPoint} flightPoint
 */
const pointValid = (flightPoint) => {
  return flightPoint.satellites >= MIN_SATELLITES;
};

const assignPoint = async (point) => {
  const result = await fetch(GAIA_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({point: point})
  });
  return await result.json();
};

const socketPort = 10800;
const socketServer = new Net.Server();
socketServer.listen(socketPort, () => {
  console.log(`Listening for SBD packets on port: ${socketPort}.`);
});

socketServer.on('connection', async (socket) => {
  console.log('A new connection has been established.');

  // Now that a TCP connection has been established, the server can send data to
  // the client by writing to its socket.
  //socket.write('Hello, client.');

  // The server can also receive data from the client by reading from its socket.
  socket.on('data', async (chunk) => {
    console.log(`Packet received: ${chunk.length} bytes`);
    const received = decodeMOData(chunk);
    logger.logJSON(received);

    try {
      let point = null;

      //console.log(`Packet log ${packetLog.isEnabled() ? 'connected' : 'disconnected'}`);
      // Manages connection status
      if (packetLog.isEnabled()) {
        if (Object.keys(received).length > 0) {
          //console.log(util.inspect(req.body.data, {showHidden: false, depth: null}));
          let packet = received.payload;
          // putting it in a list so it conforms to the xml parser
          packet['imei'] = received.header.imei;
          point = new FlightPoint(packet);

          if (pointValid(point)) {
            const result = await assignPoint(point);

            if (result.status === 'success') {
              packetLog.logPacket({
                status: 'accept',
                data: point,
                meta: {
                  type: result.type,
                  flight: result.flight
                }
              });
              console.log('accepted')
            } else {
              packetLog.logPacket({
                status: 'error',
                data: point,
                explain: 'Flight point not assignable'
              })
            }

          } else {
            packetLog.logPacket({
              status: 'reject',
              data: point
            });
            console.log('rejected')
          }

        } else {
          packetLog.logPacket({
            status: 'error',
            data: point,
            explain: 'Flight data not found in packet.'
          });
          console.log('errored')
        }
      }
      //console.log(`Packets: ${packetLog.length}`)
    } catch (e) {
      console.log(e);
    }
  });

  // Don't forget to catch error, for your own sake.
  socket.on('error', async (err) => {
    console.log(`Socket Error: ${err}`);
  });
});

export default router;
