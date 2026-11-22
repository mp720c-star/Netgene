const crypto = require("node:crypto");

function pem() {
  let key = process.env.ASC_PRIVATE_KEY || "";
  if (!key.includes("BEGIN")) {
    key = Buffer.from(key, "base64").toString("utf8");
  }
  return key.replace(/\\n/g, "\n");
}

function token() {
  const header = Buffer.from(JSON.stringify({
    alg: "ES256",
    kid: process.env.ASC_KEY_ID,
    typ: "JWT",
  })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({
    iss: process.env.ASC_ISSUER_ID,
    iat: now,
    exp: now + 600,
    aud: "appstoreconnect-v1",
  })).toString("base64url");
  const data = `${header}.${body}`;
  const signature = crypto.sign("SHA256", Buffer.from(data), {
    key: pem(),
    dsaEncoding: "ieee-p1363",
  });
  return `${data}.${signature.toString("base64url")}`;
}

async function asc(path, jwt) {
  const response = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`App Store Connect returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return JSON.parse(text);
}

module.exports = { asc, token };
