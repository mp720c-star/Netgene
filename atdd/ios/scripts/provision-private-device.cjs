const fs = require("node:fs");
const path = require("node:path");
const { asc, token } = require("./app-store-connect.cjs");

const origin = "https://api.appstoreconnect.apple.com";
const udid = (process.env.PRIVATE_DEVICE_UDID || "").trim().toUpperCase();
const bundle = process.env.BUNDLE_ID;
const lookupOnly = process.argv[2] === "--lookup";
const resource = (type, id) => ({ type, id });
const routeFor = (type, id) => "/v1/" + type + "/" + encodeURIComponent(id);

async function list(route) {
  const rows = [];
  while (route) {
    const page = await asc(route, token());
    rows.push(...page.data);
    if (!page.links?.next) break;
    const next = new URL(page.links.next);
    if (next.origin !== origin) throw new Error("Unexpected Apple pagination origin");
    route = next.pathname + next.search;
  }
  return rows;
}

async function create(type, attributes, relationships) {
  const response = await fetch(origin + "/v1/" + type, {
    method: "POST",
    headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json" },
    body: JSON.stringify({ data: { type, attributes, ...(relationships ? { relationships } : {}) } }),
  });
  const result = await response.json();
  if (!response.ok) {
    const codes = (result.errors || []).map((e) => e.code).filter((s) => /^[A-Z0-9_.-]+$/.test(s));
    const error = new Error("Apple " + type + " returned HTTP " + response.status + " " + codes.join(","));
    error.status = response.status;
    throw error;
  }
  return result.data;
}

async function findDevice() {
  const rows = await list("/v1/devices?filter[udid]=" + encodeURIComponent(udid) + "&filter[platform]=IOS&limit=2");
  const matching = rows.filter((d) => d.attributes.udid.toUpperCase() === udid);
  if (matching.length > 1) throw new Error("Apple returned more than one matching device");
  return matching[0];
}

async function findProfile(bundleId, deviceId, certificateId) {
  const profiles = await list(routeFor("bundleIds", bundleId) + "/profiles?limit=200&fields[profiles]=profileType,profileState,expirationDate");
  for (const p of profiles) {
    if (p.attributes.profileType !== "IOS_APP_ADHOC" || p.attributes.profileState !== "ACTIVE" || Date.parse(p.attributes.expirationDate) <= Date.now()) continue;
    const endpoint = routeFor("profiles", p.id);
    const devices = await list(endpoint + "/devices?limit=200&fields[devices]=deviceClass");
    if (devices.length !== 1 || devices[0].id !== deviceId) continue;
    const certificates = await list(endpoint + "/certificates?limit=200&fields[certificates]=expirationDate");
    if (certificates.some((cert) => cert.id === certificateId)) return p;
  }
}

async function main() {
  if (!/^[A-F0-9]{8}-[A-F0-9]{16}$/.test(udid) || bundle !== "com.netgene.atdd.ble") throw new Error("Missing target iPhone or unexpected app");
  const matches = await list("/v1/bundleIds?filter[identifier]=" + encodeURIComponent(bundle));
  const app = matches.find((row) => row.attributes.identifier === bundle);
  if (!app) throw new Error("ATDD bundle ID is unavailable");
  const profiles = await list(routeFor("bundleIds", app.id) + "/profiles?limit=200&fields[profiles]=uuid,profileType,profileState,expirationDate");
  const baselineUuid = process.env.EXPECTED_PROFILE_UUID.toUpperCase();
  const baseline = profiles.find((p) => p.attributes.uuid.toUpperCase() === baselineUuid && p.attributes.profileType === "IOS_APP_STORE" && p.attributes.profileState === "ACTIVE");
  if (!baseline) throw new Error("The original ATDD App Store signing profile was not found");
  const certs = (await list(routeFor("profiles", baseline.id) + "/certificates?limit=200&fields[certificates]=expirationDate")).filter((c) => Date.parse(c.attributes.expirationDate) > Date.now());
  if (certs.length !== 1) throw new Error("The original ATDD profile does not identify one active distribution certificate");
  let device = await findDevice();
  if (lookupOnly) {
    console.log("ATDD_DEVICE_REGISTRATION=" + (device ? device.attributes.status : "NOT_REGISTERED"));
    console.log("ATDD_EXISTING_SIGNING_CERTIFICATE=VERIFIED");
    return;
  }
  if (!device) {
    if (process.env.REGISTER_DEVICE !== "true") throw new Error("Private test device needs registration");
    try {
      device = await create("devices", { name: "Mike ATDD iPhone", platform: "IOS", udid });
    } catch (error) {
      if (error.status !== 409) throw error;
      device = await findDevice();
      if (!device) throw error;
    }
  }
  if (device.attributes.status !== "ENABLED" || device.attributes.udid.toUpperCase() !== udid) throw new Error("Apple has not enabled the target iPhone for provisioning");
  let profile = await findProfile(app.id, device.id, certs[0].id);
  if (!profile) {
    const relationships = {
      bundleId: { data: resource("bundleIds", app.id) },
      devices: { data: [resource("devices", device.id)] },
      certificates: { data: [resource("certificates", certs[0].id)] },
    };
    try {
      profile = await create("profiles", { name: "ATDD private iPhone " + process.env.GITHUB_RUN_ID, profileType: "IOS_APP_ADHOC" }, relationships);
    } catch (error) {
      if (error.status !== 409) throw error;
      profile = await findProfile(app.id, device.id, certs[0].id);
      if (!profile) throw error;
    }
  }
  const { data } = await asc(routeFor("profiles", profile.id) + "?fields[profiles]=profileContent,profileType,profileState", token());
  if (data.attributes.profileType !== "IOS_APP_ADHOC" || data.attributes.profileState !== "ACTIVE" || !data.attributes.profileContent) throw new Error("Apple did not return an active ad hoc profile");
  const folder = path.join(process.env.RUNNER_TEMP, "atdd-device-profiles");
  fs.mkdirSync(folder, { mode: 0o700, recursive: true });
  fs.writeFileSync(path.join(folder, "target-iphone.mobileprovision"), Buffer.from(data.attributes.profileContent, "base64"), { mode: 0o600 });
  console.log("ATDD_PRIVATE_PROFILE=READY");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
