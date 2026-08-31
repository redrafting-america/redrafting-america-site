#!/usr/bin/env swift

import AppKit
import Foundation

enum LexiconOrientation: String {
    case portrait
    case landscape

    var canvasHeight: CGFloat {
        switch self {
        case .portrait: return 1536
        case .landscape: return 1024
        }
    }

    var cleanupFrame: NSRect {
        switch self {
        case .portrait:
            return topAlignedRect(x: 35, y: 12, width: 218, height: 199)
        case .landscape:
            return topAlignedRect(x: 74, y: 6, width: 211, height: 184)
        }
    }

    var sealFrame: NSRect {
        switch self {
        case .portrait:
            return topAlignedRect(x: 54, y: 20, width: 180, height: 180)
        case .landscape:
            return topAlignedRect(x: 91, y: 10, width: 176, height: 176)
        }
    }

    private func topAlignedRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) -> NSRect {
        NSRect(x: x, y: canvasHeight - y - height, width: width, height: height)
    }
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(1)
}

guard CommandLine.arguments.count == 5 else {
    fail("Usage: update-lexicon-seal.swift portrait|landscape BASE.png SEAL.png OUTPUT.png")
}

guard let orientation = LexiconOrientation(rawValue: CommandLine.arguments[1]) else {
    fail("Orientation must be portrait or landscape.")
}

let baseURL = URL(fileURLWithPath: CommandLine.arguments[2])
let sealURL = URL(fileURLWithPath: CommandLine.arguments[3])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[4])

guard let base = NSImage(contentsOf: baseURL), let seal = NSImage(contentsOf: sealURL) else {
    fail("Could not open the base graphic or Seal image.")
}

guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: Int(base.size.width),
    pixelsHigh: Int(base.size.height),
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
) else {
    fail("Could not create the output canvas.")
}

NSGraphicsContext.saveGraphicsState()
guard let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
    fail("Could not create the drawing context.")
}
NSGraphicsContext.current = context
context.imageInterpolation = .high

base.draw(
    in: NSRect(origin: .zero, size: base.size),
    from: NSRect(origin: .zero, size: base.size),
    operation: .copy,
    fraction: 1
)

// The previous Seal was circular and extended beyond the new square artwork.
// Rebuild its header area first so none of the superseded mark remains visible.
NSColor(calibratedRed: 0.969, green: 0.953, blue: 0.918, alpha: 1).setFill()
orientation.cleanupFrame.fill()

NSColor(calibratedRed: 0.72, green: 0.52, blue: 0.17, alpha: 1).setStroke()
let sealBorder = NSBezierPath(rect: orientation.sealFrame.insetBy(dx: -1, dy: -1))
sealBorder.lineWidth = 1
sealBorder.stroke()

seal.draw(
    in: orientation.sealFrame,
    from: NSRect(origin: .zero, size: seal.size),
    operation: .copy,
    fraction: 1,
    respectFlipped: true,
    hints: [.interpolation: NSImageInterpolation.high]
)

context.flushGraphics()
NSGraphicsContext.restoreGraphicsState()

guard let png = bitmap.representation(using: .png, properties: [:]) else {
    fail("Could not encode the updated graphic as PNG.")
}

do {
    try png.write(to: outputURL, options: .atomic)
} catch {
    fail("Could not write \(outputURL.path): \(error.localizedDescription)")
}
