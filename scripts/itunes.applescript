set appName to "iTunes"
if application appName is running then
  tell application "iTunes" to get {
    artist of current track,
    name of current track,
    player position,
    duration of current track,
    player state
  }
end if