import MarkdownIt from "markdown-it"
import { anchorize, copyassets, copyfolder, duration, glob, log, mkdir, plainify, read, replace, replaceHtmlTag, rm, write } from "./util.ts"

const Markdown = MarkdownIt({ html: true, typographer: true })

export function build(): void {
  const start = performance.now()

  rm("public")
  mkdir("public")

  copyfolder("assets", "public")
  copyassets("content", "public")

  const layout = read("build/layout.html")

  for (const path of glob("content/**/*.{md,html}")) {
    let dest = replace(path, { "content/": "public/", ".md": ".html" })
    if (!dest.endsWith("/index.html")) {
      dest = dest.replace(".html", "/index.html")
    }

    const content = read(path).trim()
    const parts = content.split("---")

    if (parts.length < 3) {
      log(`page \`${path}\` is missing frontmatter`)
      continue
    }

    const [, frontmatter, ...bodyParts] = parts
    let body = bodyParts.join("---")

    const data: Record<string, string> = {}
    for (const line of frontmatter.split("\n")) {
      const match = line.match(/^\s*([^:]+)\s*:\s*(.*)$/)
      if (match) {
        const [, k, v] = match
        data[k] = v
      }
    }

    if (path.endsWith("md")) body = Markdown.render(body)

    for (const tag of ["h2", "h3", "h4"]) {
      body = replaceHtmlTag(body, tag, (content, attrs) => {
        const id = anchorize(plainify(content))
        return `<${tag}${attrs} id="${id}">${content}<a class="anchor" href="#${id}">⚓︎</a></${tag}>`
      })
    }

    const html = layout.replace("{{content}}", body).replaceAll("{{title}}", data.title || "")

    write(dest, html)
  }

  log(`Build ${duration(start)}`)
}
