import Chokidar from "chokidar"
import { globSync } from "glob"
import * as FS from "node:fs"
import * as Path from "node:path"

const dotfiles = /(^|[\/\\])\../

// After anything inside the given paths changes, wait for things to calm down, then run the given actions.
export function runWatcher(paths: string[], actions: () => any, debounceTime = 50) {
  const runActionsSoon = debounce(debounceTime, actions)
  Chokidar.watch(paths, { ignored: dotfiles, ignoreInitial: true })
    .on("error", () => log(red(`Watching ${JSON.stringify(paths)} failed`)))
    .on("all", () => runActionsSoon())
}

// Extend glob to support arrays of patterns
export const glob = (...patterns: string[]) => toSorted(unique(patterns.flatMap((p) => globSync(p))))

export const replace = (str: string, kvs: Record<string, string>) => {
  Object.entries(kvs).forEach(([k, v]) => (str = str.replaceAll(k, v)))
  return str
}

// Common file path ops
export const basename = (path: string) => Path.parse(path).name
export const parentDir = (path: string) => Path.dirname(path)

// Ensure that the parent dir exists (ie: before writing a file inside it)
export const ensureDir = (path: string) => {
  mkdir(parentDir(path) || ".")
  return path
}

export const copyfolder = (path: string, dest: string) => FS.cpSync(path, dest, { recursive: true, filter: (src) => !basename(src).startsWith(".") })
export const copyassets = (path: string, dest: string) =>
  FS.cpSync(path, dest, {
    recursive: true,
    filter: (src) => !basename(src).startsWith(".") && !Path.extname(src).endsWith("html") && !Path.extname(src).endsWith("md"),
  })

export const read = (path: string) => FS.readFileSync(path).toString()
export const mkdir = (path: string) => FS.mkdirSync(path, { recursive: true })
export const exists = (path: string) => FS.existsSync(path)
export const rm = (pattern: string) => glob(pattern).forEach((path) => FS.rmSync(path, { recursive: true }))
export const copy = (path: string, dest: string) => FS.copyFileSync(path, ensureDir(dest), FS.constants.COPYFILE_EXCL)
export const write = (dest: string, text: string) => FS.writeFileSync(ensureDir(dest), text, { flag: "wx" }) // open for writing, fail if file exists

export const toSorted = <T>(arr: T[]) => arr.toSorted()
export const unique = <T>(arr: T[]) => Array.from(new Set(arr))
export const indent = (str: string, spaces = "  ") => splitLines(str).map((line) => spaces + line).join("\n") // prettier-ignore
export const splitLines = (str: string) => str.split("\n")

export const debounce = (time: number, fn: () => void) => {
  let timeout: NodeJS.Timeout
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(fn, time)
  }
}

export const red = (t: string) => `\x1b[31m${t}\x1b[0m`
export const green = (t: string) => `\x1b[32m${t}\x1b[0m`
export const yellow = (t: string) => `\x1b[33m${t}\x1b[0m`
export const blue = (t: string) => `\x1b[34m${t}\x1b[0m`
export const magenta = (t: string) => `\x1b[35m${t}\x1b[0m`
export const cyan = (t: string) => `\x1b[36m${t}\x1b[0m`
export const grey = (t: string) => `\x1b[90m${t}\x1b[0m`
export const bold = (t: string) => `\x1b[1m${t}\x1b[0m`

// Log-able time since start
export const duration = (start: number) => grey(`(${Math.round(performance.now() - start)}ms)`)

export const getLogPrefix = () => {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false })
  return grey(timestamp + " → ")
}

// Print msg with a timestamp
export const log = (msg: any, ...more: any[]) => {
  console.log(getLogPrefix() + msg)
  for (let str of more) logIndented(str)
}

// Print msg so that it lines up with log(), but without the timestamp
export const logIndented = (msg: any) => console.log(indent(msg, "           "))

// Print a nicely-formatted error message
export const logError = (context: string, err: any) => {
  log(context)
  err instanceof Error ? console.log(err.stack) : logIndented(err)
  logIndented(red("Please report this error! It should be handled better than this."))
}

// Replace all instances of an html tag in a string, using a given replacement function
type ReplaceTagFn = (contents: string, attrs: string, spaces: string) => string
export const replaceHtmlTag = (html: string, tag: string, cb: ReplaceTagFn) => {
  const regex = new RegExp(`( *)<${tag}([^>]*)>(.*?)</${tag}>`, "gs")
  return html.replaceAll(regex, (match, spaces, attrs, contents) => cb(contents.trim(), attrs, spaces))
}

// Turn arbitrary text into nice(ish) url-safe "slugs". Eg: `This isn't *so* bad!` becomes `this-isnt-so-bad`
export const slugify = (s: string) => s.toLowerCase().replaceAll(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replaceAll(/ +/g, "-") // prettier-ignore

// Similar to the above, but preserves more of unicode (eg: letters with accents)
export const anchorize = (s: string) => s.toLowerCase().replaceAll("&amp;","and").replaceAll(/['’]/g, "").replace(/[^\p{L}\p{N}]/gu, " ").trim().replaceAll(/ +/g, "-") // prettier-ignore

export const cdata = (s: string) => `<![CDATA[${s}]]>`

// Remove HTML tags — eg, for cleaning up the description frontmatter for inclusion in <meta>
// TODO: make this smart enough to ignore code blocks inside <pre>
export const plainify = (s: string) => s.replace(/<[^>]+>/g, "")
