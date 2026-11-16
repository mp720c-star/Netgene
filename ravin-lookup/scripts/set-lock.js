#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const lockType = process.argv[2] || "";
const root = path.join(__dirname, "..");

fs.writeFileSync(
  path.join(root, "electron", "lock.json"),
  JSON.stringify({ lockType }, null, 2) + "\n"
);

fs.writeFileSync(
  path.join(root, "ravin-lock.js"),
  `window.ravinConfig = ${JSON.stringify({ lockType })};\n`
);

console.log(`Lock set to ${JSON.stringify(lockType)}`);
