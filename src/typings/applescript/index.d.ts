declare module 'applescript' {
  function execString (script: string): Promise<any>
  function execFile (path: string, args?: any[]): Promise<any>
}