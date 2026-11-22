const fs = require("node:fs");
const path = require("node:path");
const { asc, token } = require("./app-store-connect.cjs");

async function main() {
  const app = process.env.BUNDLE_ID;
  const bundle = await asc("/v1/bundleIds?filter[identifier]=" + encodeURIComponent(app), token());
  const id = bundle.data.find((row) => row.attributes.identifier === app)?.id;
  if (!id) throw new Error("Bundle ID not visible");
  const folder = path.join(process.env.RUNNER_TEMP, "atdd-device-profiles");
  fs.mkdirSync(folder, { mode: 0o700 });
  let route = "/v1/bundleIds/" + encodeURIComponent(id) + "/profiles?limit=200&fields[profiles]=profileType,profileState,expirationDate,profileContent";
  let total = 0;
  while (route) {
    const page = await asc(route, token());
    for (const { attributes: item } of page.data) {
      if (item.profileType !== "IOS_APP_ADHOC" || item.profileState !== "ACTIVE" || Date.parse(item.expirationDate) <= Date.now()) continue;
      fs.writeFileSync(path.join(folder, ++total + ".mobileprovision"), Buffer.from(item.profileContent, "base64"), { mode: 0o600 });
    }
    if (!page.links?.next) break;
    const next = new URL(page.links.next);
    if (next.origin !== "https://api.appstoreconnect.apple.com") throw new Error("Unexpected pagination origin");
    route = next.pathname + next.search;
  }
  console.log("Apple reported " + total + " active ad hoc profiles for this ATDD bundle.");
  if (!total) {
    const devices = await asc("/v1/devices?filter[platform]=IOS&filter[status]=ENABLED&limit=200&fields[devices]=model,deviceClass", token());
    const phones = devices.data.filter((row) => row.attributes.deviceClass === "IPHONE");
    console.log("Registered iPhones visible to the signing team: " + phones.length + (devices.links?.next ? " on the first page." : "."));
  }
}

main().catch((error) => {
  console.log("Could not confirm registered-device signing with this build credential: " + error.message);
});
