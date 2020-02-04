set appName to "Music"
if application appName is running then
  tell application "Music" to get { artist of current track, name of current track, player position, duration of current track, player state }
end if