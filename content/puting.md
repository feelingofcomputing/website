---
title: puting
---

<script>
  var elm = document.body.appendChild(document.createElement("p"))
  elm.style.fontFamily = "monospace"
  var arr = Array.from("computing ")
  let pos = 0
  var char = 0
  let sin = (v, s)=> (Math.sin(v) * .5 + .5) * s
  function type(ms) {
    pos += sin(ms/1000, .1) + sin(ms/1777, .1) + sin(ms/3777, .05) - Math.random()*.15
    if ((pos|0) > char) {
      elm.textContent += arr[char % arr.length]
      char++
    }
    requestAnimationFrame(type)
  }
  type(performance.now())
</script>
