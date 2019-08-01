import RotatingLog from 'rotating-log'
import moment from 'moment'

export default class Logger {
  constructor (filename, keep) {
    // create a logger that rotates at 1MB
    this.rotatingLog = new RotatingLog(`./logs/${filename}.log`, {keep: keep, maxsize: 1048576})
  }

  static timestamp () {
    return moment().format('YYYY-MM-DD HH:mm:ss.S')
  }

  log (thing) {
    this.rotatingLog.write(`[${Logger.timestamp()}] ${thing}`)
  }

  logJSON (thing) {
    this.log(JSON.stringify(thing))
  }
}