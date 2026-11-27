import assert from "node:assert/strict";
import { capacitorBleAvailable, resolveNativeBlePlugin } from "../web/js/capacitor-ble-transport.js";

{
  assert.equal(resolveNativeBlePlugin(null), null);
  assert.equal(resolveNativeBlePlugin({}), null);
  assert.equal(
    resolveNativeBlePlugin({
      isNativePlatform: () => false,
      registerPlugin: () => ({ name: "should-not-register" }),
    }),
    null,
  );
}

{
  const existing = { name: "already-registered" };
  let calls = 0;
  const plugin = resolveNativeBlePlugin({
    isNativePlatform: () => true,
    Plugins: { BluetoothLe: existing },
    registerPlugin() {
      calls += 1;
      return { name: "new" };
    },
  });
  assert.equal(plugin, existing);
  assert.equal(calls, 0);
}

{
  const created = { name: "registered" };
  const plugin = resolveNativeBlePlugin({
    isNativePlatform: () => true,
    Plugins: {},
    registerPlugin(name) {
      assert.equal(name, "BluetoothLe");
      return created;
    },
  });
  assert.equal(plugin, created);
}

{
  assert.equal(
    resolveNativeBlePlugin({
      isNativePlatform: () => true,
      Plugins: {},
    }),
    null,
  );
}

{
  let calls = 0;
  assert.equal(
    resolveNativeBlePlugin(
      {
        isNativePlatform: () => true,
        Plugins: {},
        registerPlugin() {
          calls += 1;
          return { name: "should-not-run-on-boot" };
        },
      },
      { register: false },
    ),
    null,
  );
  assert.equal(calls, 0);
}

{
  const previous = globalThis.window;
  globalThis.window = {
    Capacitor: {
      isNativePlatform: () => true,
      Plugins: {},
      registerPlugin() {
        throw new Error("boot must not registerPlugin");
      },
    },
  };
  try {
    assert.equal(capacitorBleAvailable(), true);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
}

console.log("capacitor-ble-available: ok");
