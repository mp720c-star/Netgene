# ATDD Connect → TestFlight on your iPhone (walkthrough)

**Goal:** Install **ATDD Connect** (`com.netgene.atdd.ble`) from TestFlight so FIXD Bluetooth works on your iPhone.

**Rule:** Never paste secret *values* into Cursor chat. Put them only in GitHub Secrets.

**You need:** paid Apple Developer account + any computer (Windows/Mac/Linux browser). A Mac is **not** required if you use the OpenSSL steps below.

---

## Step 0 — Confirm Apple Developer

1. Open https://developer.apple.com/account  
2. You must see a membership that is **Active** (paid).  
3. Reply in chat: **Apple Developer ready** (or say if membership is missing/expired).

---

## Step 1 — App ID with Bluetooth

1. Open https://developer.apple.com/account/resources/identifiers/list  
2. Click **+** → **App IDs** → **App** → Continue  
3. Description: `ATDD Connect`  
4. Bundle ID → **Explicit** → `com.netgene.atdd.ble`  
5. Capabilities → enable **Bluetooth** (and Push if shown optional — not required)  
6. Register / Continue / Register  
7. Reply: **App ID done**

---

## Step 2 — Distribution certificate (no Mac needed)

On a computer with OpenSSL (Git Bash on Windows works):

```bash
mkdir -p ~/atdd-signing && cd ~/atdd-signing
openssl genrsa -out atdd.distribution.key 2048
openssl req -new -key atdd.distribution.key -out atdd.distribution.csr \
  -subj "/emailAddress=YOUR_APPLE_ID_EMAIL/CN=ATDD Connect Distribution/C=US"
```

1. Open https://developer.apple.com/account/resources/certificates/list  
2. **+** → **Apple Distribution** → Continue  
3. Upload `atdd.distribution.csr` → Continue → Download the `.cer`  
4. Save it as `~/atdd-signing/atdd.distribution.cer`  
5. Convert + make `.p12` (choose a password; remember it):

```bash
cd ~/atdd-signing
openssl x509 -in atdd.distribution.cer -inform DER -out atdd.distribution.pem
# If Apple gave you PEM already, skip the line above and use the .cer as PEM.
openssl pkcs12 -export \
  -inkey atdd.distribution.key \
  -in atdd.distribution.pem \
  -out atdd.distribution.p12 \
  -name "ATDD Connect Distribution"
```

6. Reply: **Distribution cert done** (do **not** send the password or files here)

---

## Step 3 — App Store provisioning profile

1. Open https://developer.apple.com/account/resources/profiles/list  
2. **+** → **App Store Connect** (distribution) → Continue  
3. Select App ID `com.netgene.atdd.ble`  
4. Select the Apple Distribution certificate you just made  
5. Name: `ATDD Connect AppStore` → Generate → Download  
6. Save as `~/atdd-signing/ATDD_Connect_AppStore.mobileprovision`  
7. Reply: **Profile done**

---

## Step 4 — App Store Connect app record

1. Open https://appstoreconnect.apple.com/apps  
2. **+** → New App  
3. Platforms: **iOS**  
4. Name: `ATDD Connect`  
5. Bundle ID: `com.netgene.atdd.ble`  
6. SKU: `atdd-connect` (any unique string)  
7. Create  
8. Reply: **ASC app done**

---

## Step 5 — App Store Connect API key

1. Open https://appstoreconnect.apple.com/access/integrations/api  
2. **Team Keys** → **Generate API Key**  
3. Name: `ATDD TestFlight CI`  
4. Access: **App Manager** (or Admin)  
5. Generate → **Download** the `.p8` **once** → save as `~/atdd-signing/AuthKey_XXXXXX.p8`  
6. Copy **Key ID** and **Issuer ID** into a notes app (not into Cursor chat)  
7. Also copy your **Team ID** from https://developer.apple.com/account (# Membership details)  
8. Reply: **API key done**

---

## Step 6 — Put the 7 secrets into GitHub

Encode files (on the same computer):

```bash
cd ~/atdd-signing
# If you cloned Netgene:
# bash /path/to/Netgene/atdd/ios/scripts/encode-signing-secrets.sh \
#   atdd.distribution.p12 \
#   ATDD_Connect_AppStore.mobileprovision \
#   AuthKey_XXXXXX.p8

base64 < atdd.distribution.p12 | tr -d '\n' > p12.b64.txt
base64 < ATDD_Connect_AppStore.mobileprovision | tr -d '\n' > profile.b64.txt
```

Then open:
https://github.com/mp720c-star/Netgene/settings/secrets/actions

Click **New repository secret** seven times:

| Name | Paste |
| --- | --- |
| `ASC_ISSUER_ID` | Issuer ID from Step 5 |
| `ASC_KEY_ID` | Key ID from Step 5 |
| `ASC_PRIVATE_KEY` | Full text of the `.p8` file |
| `IOS_TEAM_ID` | 10-character Team ID |
| `IOS_DISTRIBUTION_P12_BASE64` | contents of `p12.b64.txt` |
| `IOS_DISTRIBUTION_P12_PASSWORD` | password from Step 2 |
| `IOS_PROVISION_PROFILE_BASE64` | contents of `profile.b64.txt` |

Reply in chat (only): **secrets added**

---

## Step 7 — Agent runs TestFlight; you install on iPhone

After you say **secrets added**:

1. Agent runs GitHub Action **atdd-ios-testflight**  
2. Wait for App Store Connect processing  
3. On iPhone: install **TestFlight** from the App Store if needed  
4. Open TestFlight → install **ATDD Connect**  
5. At the truck: open ATDD Connect → Connect FIXD → Read codes  

---

## Stuck?

Tell me the **step number** you are on and what the screen says (no secret values).
