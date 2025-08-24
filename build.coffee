FS = require "node:fs"
{ basename, dirname } = require "node:path"
Markdown = require("markdown-it")(html: true, typographer: true)

log = (m)-> console.log m

isDir = (path)-> FS.lstatSync(path).isDirectory()
readDir = (path)-> FS.readdirSync path, recursive: true, withFileTypes: true
readFile = (path)-> FS.readFileSync(path).toString()

mkdir = (path)-> FS.mkdirSync path, recursive: true
ensureDir = (path)-> mkdir(dirname(path)); path

rm = (path)-> try FS.rmSync path, recursive: true
copyFile = (path, dest)-> FS.cpSync path, dest, recursive: true, filter: (src)-> !basename(src).startsWith "."
writeFile = (path, text)-> FS.writeFileSync ensureDir(path), text



rm "public"
mkdir "public"

copyFile "assets", "public"

layout = readFile "layout.html"

for dirent in readDir "content"
  if !dirent.isFile() then continue
  if dirent.name.startsWith "." then continue

  name = dirent.name
  parent = dirent.parentPath
  srcPath = parent + "/" + name
  [name, ext] = name.split "."

  unless ext in ["html", "md"]
    copyFile srcPath, srcPath.replace "content/", "public/"
    continue

  suffix = if name in ["404", "index"] then ".html" else "/index.html"
  destPath = "#{parent}/#{name}#{suffix}".replace "content/", "public/"

  content = readFile srcPath

  [_, frontmatter, ...body] = content.split "---"

  body = body.join "---"

  if not frontmatter
    log "page `#{srcPath}` is missing frontmatter"
    continue

  data = {}
  for line in frontmatter.split "\n"
    [k, v] = line.split /\s*:\s*/
    data[k] = v

  if ext is "md" then body = Markdown.render body

  html = layout
    .replace "{{content}}", body
    .replace "{{title}}", data.title

  writeFile destPath, html
