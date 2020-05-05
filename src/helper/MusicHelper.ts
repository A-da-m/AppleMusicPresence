import { promisify } from 'util'
import applescript from 'applescript'

const exec = promisify(applescript.execString)

class MusicHelper {
  getTrackInfo () {
    return new Promise((resolve, reject) => {
      return exec(`
        set appName to "Music"
        if application appName is running then
          tell application "Music"
            if player state is playing then
              set songName to (get name of current track)
              set songArtist to (get artist of current track)
              set songDuration to (get duration of current track)
              set songPosition to (get player position)
              set songState to (get player state)
              return {songName,songArtist,songDuration,songPosition,songState}
            else if player state is paused then
              set songName to (get name of current track)
              set songArtist to (get artist of current track)
              set songDuration to (get duration of current track)
              set songPosition to (get player position)
              set songState to (get player state)
              return {songName,songArtist,songDuration,songPosition,songState}
            else
              return "Not Playing"
            end if
          end tell
        end if
     `)
      .then((results: string|number[]) => {
        return resolve({
          title: results ? results[0] : undefined,
          artist: results ? results[1] : undefined,
          duration: results ? results[2] : undefined,
          position: results ? results[3] : undefined,
          state: results ? results[4] : undefined
        })
      })
      .catch((error: Error) => {
        reject(error)
      })
    })
  }
}
export default MusicHelper
