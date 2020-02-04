import { promisify } from 'util'
import path from 'path'

const applescript = require('applescript')
const execFile = promisify(applescript.execFile)

class iTunesHelper {
  getTrackInfo () {
    return new Promise((resolve, reject) => {
     return execFile(path.resolve('./scripts/itunes.applescript'), [])
      .then((results: string|number[]) => {
        return resolve({
          artist: results ? results[0] : undefined,
          title: results ? results[1] : undefined,
          position: results ? results[2] : undefined,
          duration: results ? results[3] : undefined,
          state: results ? results[4] : undefined
        })
      })
      .catch((error: Error) => {
        reject(error)
      })
    })
  }
}
export default iTunesHelper

