# Bluetooth OBD Scanner

Browser ELM327 **BLE** scanner for Netgene.

- Connect via Web Bluetooth (Chrome/Edge, HTTPS or localhost)
- Initialize adapter (`ATZ` / `ATE0` / …)
- Read stored DTCs (Mode `03`) as raw `P/C/B/U` codes from the ECU
- Read live RPM / speed PIDs
- Demo mode when no adapter / no Web Bluetooth

Does **not** invent OBD2 repair text or ship a fabricated DTC database (ATDD originals remain gated).

**FIXD:** protocol support is **UNVERIFIED**. Do not assume FIXD speaks ELM327. Use ATDD Connect Scanner probe (`atdd/ble/fixd-protocol-probe.js`) before any FIXD claim. Simulated demo readings must never be shown as live vehicle data.

```bash
node bluetooth-scanner/tests/obd.test.mjs
```
