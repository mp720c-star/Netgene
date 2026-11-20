# ATDD Connect — TestFlight CI secrets

**App:** ATDD Connect (`com.netgene.atdd.ble`)  
**Workflow:** `.github/workflows/atdd-ios-testflight.yml` (manual **Run workflow** only)  
**Rule:** Never paste secret *values* into chat, PRs, or the repo. Names only here.

---

## 1. One-time Apple setup (you do this in a browser)

1. **Apple Developer** → Certificates, Identifiers & Profiles  
2. Create / confirm **App ID** `com.netgene.atdd.ble` with **Bluetooth** capability  
3. Create an **Apple Distribution** certificate → download `.cer`, export as `.p12` from Keychain (set a password)  
4. Create an **App Store** provisioning profile for that App ID → download `.mobileprovision`  
5. **App Store Connect** → create the app record for **ATDD Connect** / `com.netgene.atdd.ble`  
6. **App Store Connect** → Users and Access → Integrations → **App Store Connect API**  
   - Create a key with **App Manager** (or Admin) access  
   - Download the `.p8` once; note **Key ID** and **Issuer ID**

---

## 2. Encode files on a Mac (local only)

From a machine that has the `.p12` and `.mobileprovision` (do **not** commit outputs):

```bash
bash atdd/ios/scripts/encode-signing-secrets.sh \
  /path/to/distribution.p12 \
  /path/to/ATDD_Connect_AppStore.mobileprovision \
  /path/to/AuthKey_XXXXXXXXXX.p8
```

The script prints **which GitHub secret name** each blob belongs to. Copy values into GitHub only.

---

## 3. GitHub Actions secrets to add

Repo → **Settings → Secrets and variables → Actions → New repository secret**  
https://github.com/mp720c-star/Netgene/settings/secrets/actions

| Secret name | What it is |
| --- | --- |
| `ASC_ISSUER_ID` | App Store Connect API Issuer ID (UUID) |
| `ASC_KEY_ID` | App Store Connect API Key ID |
| `ASC_PRIVATE_KEY` | Full `.p8` text (including `BEGIN` / `END` lines) |
| `IOS_TEAM_ID` | 10-character Apple Team ID |
| `IOS_DISTRIBUTION_P12_BASE64` | Base64 of Apple Distribution `.p12` |
| `IOS_DISTRIBUTION_P12_PASSWORD` | Password used when exporting the `.p12` |
| `IOS_PROVISION_PROFILE_BASE64` | Base64 of App Store `.mobileprovision` |

Until **all seven** exist, the TestFlight workflow fails at the **secrets gate** with a clear missing-name list (values never logged).

---

## 4. Run the upload

1. Confirm secrets above are saved  
2. GitHub → **Actions → atdd-ios-testflight → Run workflow**  
3. Leave **Upload IPA to TestFlight** checked  
4. After processing in App Store Connect, install via **TestFlight** on your iPhone  

Unsigned simulator CI (`atdd-ios-simulator`) stays separate and does **not** need these secrets.

---

## 5. What this agent cannot do

- Create Apple certificates or App Store Connect apps for you  
- Read or set GitHub secret *values* from this Linux cloud agent  
- Install an unsigned IPA on a physical iPhone  

Once the seven secrets are in GitHub, re-run the workflow (or say **secrets added**) and CI can archive + upload.
