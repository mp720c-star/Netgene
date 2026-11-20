# ATDD Bluetooth button — 2026-11-20

## Order
Use Michael’s live ATDD link and add a Bluetooth button.

## Source URL
https://cursor-kathy-health-app-cfb3-noisy-pond-2dc8.michaelepaine.workers.dev/index.html

## What changed
- Mirrored ATDD **v1.2.0** into `atdd/classic/`
- Top bar: Diagnose · Listen · Look · Code · **Bluetooth** · Save · Export · Computer
- Bluetooth opens **Connect FIXD** panel: live Web Bluetooth connect / scan-any / read Mode 03 codes into `#codes`; Demo only is separate and labeled SIMULATED
- Cloudflare hub `prepare-site` serves classic at `/atdd/`; prior Connect Scanner at `/atdd/connect/`

## Not done
- Does not rewrite the Kathy Workers deployment automatically
- FIXD protocol claim remains **UNVERIFIED**
- iPhone Home Screen web shell still cannot use Web Bluetooth
