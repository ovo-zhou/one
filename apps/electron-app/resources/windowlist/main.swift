// Window-list helper for screenshot mode.
//
// Polls CGWindowListCopyWindowInfo and emits one JSON array of windows per
// line. Used without the on-screen-only flag on purpose: the fullscreen
// screenshot overlay would otherwise hide every window behind it from the
// on-screen list. Hidden/minimized windows are filtered via alpha.
//
// Usage:
//   windowlist            -> one snapshot, then exit
//   windowlist -stream    -> snapshots every ~100ms until killed
//
// Build: swiftc -O main.swift -o windowlist

import Cocoa
import CoreGraphics

struct WindowBounds: Codable {
  let x: Double
  let y: Double
  let w: Double
  let h: Double
}

struct WindowInfo: Codable {
  let id: Int
  let pid: Int
  let owner: String
  let name: String
  let layer: Int
  let bounds: WindowBounds
}

let streamMode = CommandLine.arguments.contains("-stream")
let encoder = JSONEncoder()

func collect() -> [WindowInfo] {
  guard
    let list = CGWindowListCopyWindowInfo([.excludeDesktopElements], kCGNullWindowID)
      as? [[String: Any]]
  else {
    return []
  }
  var out: [WindowInfo] = []
  for info in list {
    guard let layer = info[kCGWindowLayer as String] as? Int, layer == 0 || layer == 1 else {
      continue
    }
    guard let alpha = info[kCGWindowAlpha as String] as? Double, alpha > 0 else {
      continue
    }
    guard
      let rawBounds = info[kCGWindowBounds as String] as? [String: Any],
      let x = rawBounds["X"] as? Double,
      let y = rawBounds["Y"] as? Double,
      let w = rawBounds["Width"] as? Double,
      let h = rawBounds["Height"] as? Double,
      w > 0, h > 0
    else {
      continue
    }
    out.append(
      WindowInfo(
        id: (info[kCGWindowNumber as String] as? Int) ?? 0,
        pid: (info[kCGWindowOwnerPID as String] as? Int) ?? 0,
        owner: (info[kCGWindowOwnerName as String] as? String) ?? "",
        name: (info[kCGWindowName as String] as? String) ?? "",
        layer: layer,
        bounds: WindowBounds(x: x, y: y, w: w, h: h)
      )
    )
  }
  return out
}

func emit() {
  let data = (try? encoder.encode(collect())) ?? Data()
  var line = String(data: data, encoding: .utf8) ?? ""
  line += "\n"
  fputs(line, stdout)
  fflush(stdout)
}

if streamMode {
  while true {
    emit()
    usleep(100_000)
  }
} else {
  emit()
}