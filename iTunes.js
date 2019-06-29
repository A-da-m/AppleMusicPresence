const { promisify } = require('util')
const applescript = require('applescript')

const script = {
  main:
      'tell application "iTunes" to get { artist of current track, name of current track, player position, duration of ' +
      'current track, player state }'
}

const run = promisify(applescript.execString)

module.exports = async () => {
  const [artist, title, position, duration, state] = await run(script.main)

  return {
    state,
    artist,
    title,
    position,
    duration
  }
}
