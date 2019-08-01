import express from "express";

const router = express.Router();

router.post('/', async (req, res, next) => {
  const packetLog = req.packetLog;
  //console.log('Packet Log:');
  //console.log(packetLog);
  if ('last_ids' in req.body) {
    const clientIDs = req.body.last_ids;
    //console.log(`Client:${clientIDs}`);
    const presentIDs = packetLog.presentIDs();
    //console.log(`Present:${presentIDs}`);
    const updateIDs = presentIDs.reduce((result, current) => {
      if (!(clientIDs.includes(current))) result.push(current);
      return result;
    }, []);
    //console.log(`Update:${updateIDs}`);

    const update = packetLog.subLog(updateIDs);

    if (update.length > 0) {
      res.json({
        status: 'available',
        update: update
      });
    } else {
      res.json({
        status: 'none'
      });
    }
  } else {
    res.sendStatus(400);
  }
});

export default router;