declare module 'applescript' {
  function exec (script: string): Promise<any>
  function execFile (path: string, args?: any[]): Promise<any>
}