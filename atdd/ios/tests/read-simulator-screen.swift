import Foundation
import Vision

let image = URL(fileURLWithPath: CommandLine.arguments[1])
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
try VNImageRequestHandler(url: image).perform([request])
let words = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
let joined = words.joined(separator: " ").lowercased().filter { $0.isLetter || $0.isNumber }
let expected = ["diagnose", "listen", "look", "code", "connectscanner", "diagnosticsfordummies", "4783"]
let missing = expected.filter { !joined.contains($0) }
if !missing.isEmpty {
    print("Waiting for iPhone screen. Visible text:", words.joined(separator: " | "))
    exit(1)
}
print("iPhone simulator displayed the original ATDD screen, Connect Scanner and 4,783 offline codes.")
