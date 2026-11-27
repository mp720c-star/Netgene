/* How-to and scanner hubs for classic ATDD.
   Educational content only — does not invent vehicle readings or OEM torque.
   Loaded as window.HOWTO_HUB_DATA. */
(function (root) {
  function article(id, title, summary, steps, links) {
    return {
      id: id,
      title: title,
      summary: summary,
      steps: steps || [],
      links: links || []
    };
  }

  root.HOWTO_HUB_DATA = {
    version: 1,
    title: "ATDD how-to and scanner hubs",
    categories: [
      {
        id: "obd_basics",
        title: "OBD basics",
        blurb: "What the check-engine light means and how codes fit the Diagnose flow.",
        articles: [
          article(
            "mil-steady-vs-flash",
            "Steady light vs flashing light",
            "A steady MIL means store the codes and diagnose. A flashing MIL means a severe misfire that can damage the converter — reduce load and fix misfire first.",
            [
              "Steady (on solid): write down every code, then use Code lookup or Connect → Read codes.",
              "Flashing while driving: treat it as an active misfire. Ease off; do not keep flooring it.",
              "Use Listen / Look / Code on the Scan tab, then Diagnose. Repair steps land on Results.",
              "Clear codes only after the repair, with the Clear codes control — New scan does not clear the vehicle."
            ],
            [
              { kind: "tab", target: "scan", label: "Open Scan" },
              { kind: "code", target: "P0300", label: "Example: P0300" }
            ]
          ),
          article(
            "code-families",
            "P, C, B, and U families",
            "P = powertrain, C = chassis (often ABS), B = body, U = network/lost communication.",
            [
              "P0xxx codes are the common generic powertrain set ATDD explains in depth.",
              "C0xxx wheel-speed and ABS codes need jack stands and harness checks — see ABS hub.",
              "U0xxx often start with a weak battery or a wet module connector, not a new computer.",
              "Unknown codes stay labeled unknown. ATDD does not invent a fix for a code it does not know."
            ],
            [
              { kind: "tab", target: "symptoms", label: "Symptoms hub" },
              { kind: "code", target: "U0100", label: "Example: U0100" }
            ]
          )
        ]
      },
      {
        id: "scanners",
        title: "Scanners & adapters",
        blurb: "How ATDD Connect talks to a Bluetooth OBD-II reader.",
        articles: [
          article(
            "elm-ble-reader",
            "Any ELM327-style Bluetooth reader",
            "ATDD Connect speaks ELM327 AT commands over BLE UART. Generic adapters that answer those commands can be used. Brand-private protocols stay unverified.",
            [
              "Plug the adapter into the OBD-II port (usually under the dash). Key on, engine off for a first read.",
              "On Scan, tap Connect. Prefer a known adapter, or use Scan any BLE device if your reader uses a generic name.",
              "After connect, use Read codes. Results show only what the adapter returned — nothing is fabricated.",
              "FIXD and other brand-locked protocols are labeled UNVERIFIED until field-proven. A generic ELM-class dongle is the supported path."
            ],
            [
              { kind: "scroll", target: "bluetoothCard", label: "Bluetooth card" },
              { kind: "tab", target: "scan", label: "Open Scan" }
            ]
          ),
          article(
            "what-read-returns",
            "What Read codes returns",
            "A full read can include stored, pending, and permanent emissions codes, VIN when supported, and chassis codes when that module answers.",
            [
              "Stored (Mode 03), pending (07), and permanent (0A) are separate. Permanent codes may not clear until the monitor runs.",
              "If ABS/chassis answers the probe, those C-codes appear in the readout. Silent modules are not invented.",
              "After a successful read, use Diagnose and repair steps to open Results with DIY guidance.",
              "Live wheel speeds and OEM PIDs stay fail-closed unless the scaling is verified — raw only when unknown."
            ],
            [
              { kind: "scroll", target: "scanReadoutCard", label: "Scan readout" }
            ]
          ),
          article(
            "clear-vs-new-scan",
            "Clear codes vs New scan",
            "Clear sends Mode 04 (and module clears when modules answered). New scan only resets the app session and disconnects.",
            [
              "Clear codes asks for confirmation. Park, key on, engine off.",
              "Mode 04 plus clear-all to modules that answered may include ABS when it answered the last scan.",
              "OEM-locked or permanent faults can remain. Clearing does not fix a broken sensor.",
              "New scan clears on-screen case data and disconnects. It does not send 04 to the vehicle."
            ],
            [
              { kind: "scroll", target: "bluetoothCard", label: "Clear codes control" }
            ]
          )
        ]
      },
      {
        id: "abs_chassis",
        title: "ABS & chassis",
        blurb: "Wheel-speed, pump, and lost-ABS communication paths.",
        articles: [
          article(
            "wheel-speed-diy",
            "Wheel-speed sensor codes",
            "C0035 / C0040 / C0045 / C0050 and similar corner codes are usually a broken harness, a packed sensor tip, or a failing hub tone ring.",
            [
              "Support the corner on a jack stand. Do not crawl under a bumper jack.",
              "Inspect the small harness at the strut and hub. Cracked insulation is a common root cause.",
              "Unbolt the sensor, check the tip for chips or metal pack, replace if damaged, and snug the bolt — do not over-torque.",
              "A clunk or growl after a new sensor points to the hub/bearing. That is a bigger DIY or a shop hub."
            ],
            [
              { kind: "code", target: "C0035", label: "C0035 DIY" },
              { kind: "job", target: "hubs", label: "Hubs job" }
            ]
          ),
          article(
            "abs-module-quiet",
            "ABS module offline (U0121)",
            "Lost communication with ABS often starts with fuses, water in the connector, or a shorted wheel-speed wire — not a junkyard module.",
            [
              "Charge the battery and check ABS/ESC fuses.",
              "Unplug the ABS connector on the hydraulic unit; look for water or green pins.",
              "If a corner C-code is also present, repair that harness before condemning the module.",
              "A replacement ABS unit often needs programming. Prove power and a dry connector first."
            ],
            [
              { kind: "code", target: "U0121", label: "U0121 DIY" },
              { kind: "job", target: "brakes", label: "Brakes job" }
            ]
          )
        ]
      },
      {
        id: "diagnose_flow",
        title: "Diagnose flow",
        blurb: "Listen → Look → Code → Diagnose → Results, with jobs when needed.",
        articles: [
          article(
            "listen-look-code",
            "Listen, Look, Code",
            "Capture sound and a photo when you can, enter or read codes, then Diagnose once.",
            [
              "Listen: idle knock, tick, squeal, or grind for 10–20 seconds.",
              "Look: exhaust or belt area — capture a frame or upload a photo.",
              "Code: type a code, tap an example chip, or Connect → Read codes.",
              "Diagnose opens Results with causes, tests, and DIY steps. Browse how-to jobs only when you already know the job."
            ],
            [
              { kind: "tab", target: "scan", label: "Start on Scan" },
              { kind: "tab", target: "more", label: "More → jobs" }
            ]
          ),
          article(
            "symptoms-to-jobs",
            "Symptoms and driveway jobs",
            "The Symptoms tab is a cause/test hub. More → Browse how-to jobs holds full procedures like starter, brakes, and oil.",
            [
              "Search a symptom or pick a system on Symptoms.",
              "Related DTCs and jobs appear on the entry when cited.",
              "Open a job from More when the diagnosis points at a known procedure.",
              "All repair solutions is a reference index — day-to-day use still goes through Diagnose."
            ],
            [
              { kind: "tab", target: "symptoms", label: "Symptoms" },
              { kind: "scroll", target: "jobsCard", label: "How-to jobs" }
            ]
          )
        ]
      }
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);
