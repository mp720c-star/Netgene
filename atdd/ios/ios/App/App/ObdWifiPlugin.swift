import Foundation
import Network
import Capacitor

/**
 Wi-Fi OBD-II TCP bridge for ELM327-class adapters (typically 192.168.0.10:35000).
 Read-only command/response over ASCII. Not Bluetooth Classic.
 */
@objc(ObdWifiPlugin)
public class ObdWifiPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ObdWifiPlugin"
    public let jsName = "ObdWifi"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "send", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise)
    ]

    private var connection: NWConnection?
    private let queue = DispatchQueue(label: "com.netgene.atdd.ble.obdwifi")
    private var receiveBuffer = Data()
    private var connectedHost: String?
    private var connectedPort: UInt16?
    private var connectFinished = false

    @objc func connect(_ call: CAPPluginCall) {
        let host = call.getString("host") ?? "192.168.0.10"
        let portNum = call.getInt("port") ?? 35000
        let timeoutMs = call.getInt("timeoutMs") ?? 8000
        guard let port = NWEndpoint.Port(rawValue: UInt16(portNum)) else {
            call.reject("Invalid Wi-Fi OBD port")
            return
        }

        disconnectInternal()
        connectFinished = false

        let endpoint = NWEndpoint.hostPort(host: NWEndpoint.Host(host), port: port)
        let conn = NWConnection(to: endpoint, using: .tcp)
        self.connection = conn
        self.connectedHost = host
        self.connectedPort = UInt16(portNum)
        self.receiveBuffer = Data()

        conn.stateUpdateHandler = { [weak self] state in
            guard let self = self else { return }
            switch state {
            case .ready:
                self.finishConnect(call, ok: true, message: nil, host: host, port: portNum)
                self.startReceiveLoop()
            case .failed(let error):
                self.finishConnect(call, ok: false, message: "Wi-Fi OBD connection failed: \(error.localizedDescription)", host: host, port: portNum)
                self.disconnectInternal()
            default:
                break
            }
        }

        conn.start(queue: queue)

        queue.asyncAfter(deadline: .now() + .milliseconds(timeoutMs)) { [weak self] in
            guard let self = self else { return }
            if self.connectFinished { return }
            self.finishConnect(
                call,
                ok: false,
                message: "Wi-Fi OBD connect timeout to \(host):\(portNum). Join the adapter Wi-Fi network first.",
                host: host,
                port: portNum
            )
            self.disconnectInternal()
        }
    }

    private func finishConnect(_ call: CAPPluginCall, ok: Bool, message: String?, host: String, port: Int) {
        queue.async {
            if self.connectFinished { return }
            self.connectFinished = true
            DispatchQueue.main.async {
                if ok {
                    call.resolve(["ok": true, "host": host, "port": port])
                } else {
                    call.reject(message ?? "Wi-Fi OBD connect failed")
                }
            }
        }
    }

    @objc func send(_ call: CAPPluginCall) {
        guard let conn = connection, case .ready = conn.state else {
            call.reject("Wi-Fi OBD not connected. Join the adapter Wi-Fi, then Connect Wi-Fi OBD.")
            return
        }
        guard let dataStr = call.getString("data") else {
            call.reject("Missing data")
            return
        }
        let waitForPrompt = call.getBool("waitForPrompt") ?? true
        let timeoutMs = call.getInt("timeoutMs") ?? 8000
        guard let payload = dataStr.data(using: .utf8) else {
            call.reject("Could not encode OBD payload")
            return
        }

        receiveBuffer = Data()

        conn.send(content: payload, completion: .contentProcessed { [weak self] error in
            guard let self = self else { return }
            if let error = error {
                DispatchQueue.main.async {
                    call.reject("Wi-Fi OBD send failed: \(error.localizedDescription)")
                }
                return
            }
            if !waitForPrompt {
                DispatchQueue.main.async {
                    call.resolve(["ok": true, "data": ""])
                }
                return
            }
            self.waitForPrompt(timeoutMs: timeoutMs) { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let text):
                        call.resolve(["ok": true, "data": text])
                    case .failure(let err):
                        call.reject(err.localizedDescription)
                    }
                }
            }
        })
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        disconnectInternal()
        call.resolve(["ok": true])
    }

    @objc func status(_ call: CAPPluginCall) {
        let ready: Bool
        if let conn = connection, case .ready = conn.state {
            ready = true
        } else {
            ready = false
        }
        call.resolve([
            "connected": ready,
            "host": connectedHost as Any,
            "port": connectedPort as Any
        ])
    }

    private func startReceiveLoop() {
        guard let conn = connection else { return }
        conn.receive(minimumIncompleteLength: 1, maximumLength: 4096) { [weak self] content, _, isComplete, error in
            guard let self = self else { return }
            if let content = content, !content.isEmpty {
                self.receiveBuffer.append(content)
            }
            if error == nil && !isComplete {
                self.startReceiveLoop()
            }
        }
    }

    private func waitForPrompt(timeoutMs: Int, completion: @escaping (Result<String, Error>) -> Void) {
        queue.async {
            let deadline = Date().addingTimeInterval(Double(timeoutMs) / 1000.0)
            func tick() {
                if let text = String(data: self.receiveBuffer, encoding: .utf8), text.contains(">") {
                    completion(.success(text))
                    self.receiveBuffer = Data()
                    return
                }
                if Date() >= deadline {
                    let partial = String(data: self.receiveBuffer, encoding: .utf8) ?? ""
                    if !partial.isEmpty {
                        completion(.success(partial))
                        self.receiveBuffer = Data()
                    } else {
                        completion(.failure(NSError(domain: "ObdWifi", code: 1, userInfo: [
                            NSLocalizedDescriptionKey: "Wi-Fi OBD response timeout (no data)"
                        ])))
                    }
                    return
                }
                self.queue.asyncAfter(deadline: .now() + 0.05, execute: tick)
            }
            tick()
        }
    }

    private func disconnectInternal() {
        connection?.cancel()
        connection = nil
        connectedHost = nil
        connectedPort = nil
        receiveBuffer = Data()
    }
}
