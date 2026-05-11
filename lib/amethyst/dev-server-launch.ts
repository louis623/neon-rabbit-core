type WindowsDetachedDevServerLaunchOptions = {
  cwd: string
  errPath: string
  outPath: string
  port: number
}

type WindowsDetachedDevServerLaunch = {
  argumentList: string[]
  filePath: string
}

function quoteForCmd(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

export function buildWindowsDetachedDevServerLaunch({
  cwd,
  errPath,
  outPath,
  port,
}: WindowsDetachedDevServerLaunchOptions): WindowsDetachedDevServerLaunch {
  const shell = process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe'
  const command = [
    `cd /d ${quoteForCmd(cwd)}`,
    `npm run dev -- --port ${port} > ${quoteForCmd(outPath)} 2> ${quoteForCmd(errPath)}`,
  ].join(' && ')

  return {
    filePath: shell,
    argumentList: ['/c', command],
  }
}
