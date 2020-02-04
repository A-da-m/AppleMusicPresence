import { promisify } from 'util'
import applescript from 'applescript'
import path from 'path'

const execFile = promisify(applescript.execFile)

class MusicHelper {
  getTrackInfo () {
    return new Promise((resolve, reject) => {
     return execFile(path.resolve('./scripts/music.applescript'), [])
      .then((results: string|number[]) => {
        return resolve({
          artist: results ? results[0] : undefined,
          title: results ? results[1] : undefined,
          position: results ? results[2] : undefined,
          duration: results ? results[3] : undefined,
          state: results ? results[4] : undefined
        })
      })
      .catch(error => {
        reject(error)
      })
    })
  }
}
export default MusicHelper
