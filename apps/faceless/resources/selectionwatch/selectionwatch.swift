import Foundation
import AppKit
import ApplicationServices.HIServices

// Selection watcher used by the selection-translate feature.
//
// macOS exposes no event for "text selection changed", so this helper polls
// the system focused element's AXSelectedText (and the bounds of the selected
// range) and prints one JSON line per change:
//
//   {"text":"hello","x":100,"y":200,"w":60,"h":20,"pid":1234}
//   {"text":""}                     // selection cleared / changed away
//   {"error":"not-trusted"}         // accessibility permission missing
//
// Modes:
//   --stream (default)  poll forever, emit on change
//   --once              emit the current selection once and exit
//
// Coordinates are global "flipped" screen coordinates in points, matching
// Electron's screen coordinate space on macOS.

let args = CommandLine.arguments
let once = args.contains("--once")
// 100ms keeps the perceived latency from selection to pill low; a single
// AXSelectedText query costs well under 1ms so the CPU impact is negligible.
let pollIntervalUs: useconds_t = once ? 0 : 100_000

func emit(_ line: String) {
  FileHandle.standardOutput.write((line + "\n").data(using: .utf8)!)
}

func jsonEscape(_ s: String) -> String {
  var out = ""
  for scalar in s.unicodeScalars {
    switch scalar {
    case "\"": out += "\\\""
    case "\\": out += "\\\\"
    case "\n": out += "\\n"
    case "\r": out += "\\r"
    case "\t": out += "\\t"
    default:
      if scalar.value < 0x20 {
        out += String(format: "\\u%04x", scalar.value)
      } else {
        out.unicodeScalars.append(scalar)
      }
    }
  }
  return out
}

if !AXIsProcessTrusted() {
  emit("{\"error\":\"not-trusted\"}")
  exit(1)
}

// Not exported in the public headers; see AXAttributeConstants documentation.
let kAXEnhancedUserInterfaceAttribute = "AXEnhancedUserInterface" as CFString

// Chromium-based apps only expose their AX tree once an assistive client has
// flipped AXEnhancedUserInterface on the application element; do it lazily,
// once per pid (harmless for native apps).
var enhancedPids = Set<pid_t>()
func ensureEnhancedAX(pid: pid_t) {
  if enhancedPids.contains(pid) { return }
  enhancedPids.insert(pid)
  let app = AXUIElementCreateApplication(pid)
  AXUIElementSetAttributeValue(app, kAXEnhancedUserInterfaceAttribute, kCFBooleanTrue)
}

struct Selection {
  var text: String
  var x = 0.0
  var y = 0.0
  var w = 0.0
  var h = 0.0
  var pid: pid_t = 0
}

func readSelection() -> Selection? {
  // NOTE: querying kAXFocusedUIElementAttribute on the system-wide element
  // fails with kAXErrorCannotComplete on current macOS for CLI processes, so
  // go through the frontmost application's element instead.
  guard let front = NSWorkspace.shared.frontmostApplication else { return nil }
  let pid = front.processIdentifier
  ensureEnhancedAX(pid: pid)
  let app = AXUIElementCreateApplication(pid)

  var focusedRef: CFTypeRef?
  guard
    AXUIElementCopyAttributeValue(app, kAXFocusedUIElementAttribute as CFString, &focusedRef)
      == .success
  else { return nil }
  let focused = unsafeBitCast(focusedRef, to: AXUIElement.self)

  var textRef: CFTypeRef?
  guard
    AXUIElementCopyAttributeValue(focused, kAXSelectedTextAttribute as CFString, &textRef)
      == .success
  else { return nil }
  guard let text = (textRef as AnyObject) as? String, !text.isEmpty else { return nil }

  var sel = Selection(text: text, pid: pid)

  // Bounds of the selected range, if the element supports it.
  var rangeRef: CFTypeRef?
  if AXUIElementCopyAttributeValue(
    focused, kAXSelectedTextRangeAttribute as CFString, &rangeRef) == .success
  {
    let rangeValue = unsafeBitCast(rangeRef, to: AXValue.self)
    var range = CFRange()
    if AXValueGetValue(rangeValue, .cfRange, &range), let req = AXValueCreate(.cfRange, &range) {
      var boundsRef: CFTypeRef?
      if AXUIElementCopyParameterizedAttributeValue(
        focused, kAXBoundsForRangeParameterizedAttribute as CFString, req, &boundsRef)
        == .success
      {
        let boundsValue = unsafeBitCast(boundsRef, to: AXValue.self)
        var bounds = CGRect.zero
        AXValueGetValue(boundsValue, .cgRect, &bounds)
        sel.x = bounds.origin.x
        sel.y = bounds.origin.y
        sel.w = bounds.width
        sel.h = bounds.height
      }
    }
  }
  return sel
}

var lastSig = ""

func pollOnce() -> Bool {
  if let sel = readSelection() {
    let sig = "\(sel.pid)|\(sel.text)|\(Int(sel.x)),\(Int(sel.y)),\(Int(sel.w)),\(Int(sel.h))"
    if sig != lastSig {
      lastSig = sig
      emit(
        "{\"text\":\"\(jsonEscape(sel.text))\",\"x\":\(sel.x),\"y\":\(sel.y),\"w\":\(sel.w),\"h\":\(sel.h),\"pid\":\(sel.pid)}"
      )
    }
  } else if !lastSig.isEmpty {
    lastSig = ""
    emit("{\"text\":\"\"}")
  }
  return false
}

if once {
  // NSWorkspace needs a serviced run loop even for a single frontmost query
  // when launched cold; warm it up with one runloop spin first.
  RunLoop.current.run(until: Date().addingTimeInterval(0.05))
  _ = pollOnce()
  exit(0)
}

// Stream mode: poll on a run-loop timer. A bare while/usleep loop keeps the
// process from servicing AppKit/NSWorkspace updates, which silently freezes
// frontmostApplication at its first (stale) value.
let timer = Timer(timeInterval: Double(pollIntervalUs) / 1_000_000, repeats: true) { _ in
  _ = pollOnce()
}
RunLoop.current.add(timer, forMode: .default)
RunLoop.current.run()
