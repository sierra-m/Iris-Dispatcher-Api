import express from "express";

const router = express.Router();

router.post('/', async (req, res, next) => {
  /*console.log('packetlog:');
  console.log(req.packetLog);
  console.log('body:');
  console.log(req.body);*/
  const packetLog = req.packetLog;
  try {
    if ('state' in req.body) {
      packetLog.enable(req.body.state);
      //console.log(`Packet log ${packetLog.isEnabled() ? 'connected' : 'disconnected'}`)
      res.json({
        status: 'success',
        state: packetLog.isEnabled()
      });
    } else {
      res.sendStatus(400);
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  res.json({
    state: req.packetLog.isEnabled()
  })
});

export default router;