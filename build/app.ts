import { parseArgs } from "node:util"
import { reload, serve } from "./server.ts"
import { green, runWatcher } from "./util.ts"
import { build } from "./build.ts"

const watch = () =>
  runWatcher(["assets", "content"], () => {
    build()
    reload()
  })

const tasks = {
  start: {
    help: "Build, watch, and serve\n",
    cmd: () => {
      build()
      watch()
      serve()
    },
  },
  build: { help: "Compile everything", cmd: build },
  watch: { help: "Recompile on changes", cmd: watch },
  serve: { help: "Spin up a live server\n", cmd: serve },
  help: {
    help: "Print this help info",
    cmd: () => {
      console.log(green("\n  Feeling of Computing • Website CLI\n"))
      console.log("  Usage:\n")
      let longestName = Object.keys(tasks).reduce((l, name) => Math.max(l, name.length), 0)
      for (const [name, { help }] of Object.entries(tasks)) console.log(green(`    foc ${name.padEnd(longestName)}  `) + help)
      console.log("")
    },
  },
}

type Task = keyof typeof tasks
const args = parseArgs({ allowPositionals: true })
const task = (args.positionals[0] || "help") as Task

if (tasks[task]) {
  tasks[task].cmd()
} else {
  console.error(`Unknown task: ${task}`)
}
