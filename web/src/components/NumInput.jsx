import { useState, useEffect } from "react"
import { parseNum } from "../lib/format.js"

function group(n) {
  if (n === 0) return "0"
  if (!n || isNaN(n)) return ""
  return new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 6 }).format(n)
}

export default function NumInput({ value, onCommit, className = "" }) {
  const [text, setText] = useState("")
  const [focused, setFocused] = useState(false)

  const display = value === 0 || value == null || value === "" ? "" : group(Number(value))

  return (
    <input
      type="text"
      inputMode="decimal"
      dir="ltr"
      className={`num-input ${className}`.trim()}
      value={focused ? text : display}
      onFocus={() => {
        setFocused(true)
        setText(value === 0 || value == null ? "" : String(value))
      }}
      onChange={(e) => {
        setText(e.target.value)
        onCommit(parseNum(e.target.value))
      }}
      onBlur={() => setFocused(false)}
    />
  )
}
