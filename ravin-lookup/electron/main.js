const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

function readLockType() {
  if (process.env.RAVIN_LOCK_TYPE) return process.env.RAVIN_LOCK_TYPE;
  try {
    const lockPath = path.join(__dirname, "lock.json");
    const data = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    return data.lockType || "";
  } catch {
    return "";
  }
}

const LOCK_TYPE = readLockType();

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 1000,
    minWidth: 420,
    minHeight: 640,
    title: LOCK_TYPE ? `Ravin Lookup — ${LOCK_TYPE}` : "Ravin Lookup",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexPath = path.join(__dirname, "..", "Index.html");
  if (LOCK_TYPE) {
    win.loadFile(indexPath, { query: { lock: LOCK_TYPE } });
  } else {
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
