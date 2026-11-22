#!/usr/bin/env python3
"""Build the additive symptom/system repair database for classic ATDD.

Procedures are original wording. Meanings that a license-compatible government
source actually supports are marked tier=cited and point at that source.
Everything else is generated-general. Numeric specs are 'per service manual'
unless a cited universal value is attached to that test.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_JS = ROOT / "classic/data/symptom-repair-db.js"
OUT_MANIFEST = ROOT / "classic/data/symptom-repair.manifest.json"

MANUAL = "per service manual"

SPEC_TIRE_TREAD = (
    "2/32 inch — NHTSA TireWise: replace the tire when tread is worn to 2/32 inch, "
    "when the built-in wear bars are flush with the tread, or when a penny placed "
    "in the tread with Lincoln's head upside down shows the top of Lincoln's head"
)
SPEC_TIRE_COLD = (
    "NHTSA TireWise: check pressure when the tires are cold (vehicle not driven for "
    "at least three hours). Use the pressure on the driver's door sticker or owner's "
    "manual, not the number molded on the tire sidewall"
)
SPEC_SHOCK_BOUNCE = (
    "FTC Auto Repair Basics: after you bounce that corner of the vehicle hard and let go, "
    "more than one rebound indicates weak shock absorbers or struts"
)
SPEC_DOE_OCV = (
    "DOE-HDBK-1084-95: a lead-acid cell's open-circuit voltage is approximately "
    "specific gravity + 0.845. Compare the rested pack reading to the voltage or "
    "specific-gravity table in the service manual for this battery; this app does "
    "not invent a single pack voltage"
)

SOURCES = [
    {
        "id": "ftc_basics",
        "name": "FTC, Auto Repair Basics (August 2012)",
        "url": "https://www.govinfo.gov/content/pkg/GOVPUB-FT-PURL-gpo61874/pdf/GOVPUB-FT-PURL-gpo61874.pdf",
        "license": "U.S. government work, public domain (17 U.S.C. § 105)",
        "used_for": "Fluid colors, smells, common noises, steering/brake/engine/transmission symptom lists, and the 'check the simple thing first' notes on battery terminals, starter connections, and alternator wiring.",
    },
    {
        "id": "epa_obd",
        "name": "EPA, Do you drive a 1996 or newer car or light truck? (EPA-420-F-02-016, rev. Sept. 2012)",
        "url": "https://www.epa.gov/sites/default/files/2013-08/documents/420f02016.pdf",
        "license": "U.S. government work, public domain (17 U.S.C. § 105)",
        "used_for": "Steady vs blinking check-engine light, loose gas cap, and catalyst-damaging misfire guidance.",
    },
    {
        "id": "nhtsa_tires",
        "name": "NHTSA TireWise tire safety consumer guidance",
        "url": "https://www.nhtsa.gov/vehicle-safety/tires",
        "license": "U.S. government work, public domain (17 U.S.C. § 105)",
        "used_for": "Cold tire-pressure checks, door-sticker inflation, 2/32-inch tread / penny test, and that TPMS warns only when a tire is significantly underinflated.",
    },
    {
        "id": "oregon_smoke",
        "name": "Oregon DEQ, Smoking Vehicles (updated 2015-02-18)",
        "url": "https://www.oregon.gov/deq/FilterDocs/SmokingVehicles.pdf",
        "license": "Oregon state government consumer publication; facts cited, wording original (see manifest note)",
        "used_for": "Gasoline and diesel exhaust smoke-color meanings, and that winter water vapor is not smoke.",
    },
    {
        "id": "pa_dep_smoke",
        "name": "Pennsylvania DEP, Automobiles — Car Care (visible smoke table, citing TCEQ 2002)",
        "url": "https://www.pa.gov/agencies/dep/programs-and-services/air/bureau-of-air-quality/automobiles/car-care",
        "license": "Pennsylvania state government consumer publication; facts cited, wording original (see manifest note)",
        "used_for": "Independent state confirmation of the same smoke-color meanings used in the Oregon DEQ table.",
    },
    {
        "id": "fueleconomy",
        "name": "DOE / EPA FuelEconomy.gov FAQ — excessively low fuel economy",
        "url": "https://www.fueleconomy.gov/feg/info.shtml",
        "license": "U.S. government work, public domain (17 U.S.C. § 105)",
        "used_for": "Diagnostic checklist a shop typically runs for unusually poor fuel economy.",
    },
    {
        "id": "doe_battery",
        "name": "DOE-HDBK-1084-95, Primer on Lead-Acid Storage Batteries",
        "url": "https://www.energy.gov/sites/default/files/2026-05/DOE-HDBK-1084-95.pdf",
        "license": "U.S. government work, public domain (17 U.S.C. § 105)",
        "used_for": "Open-circuit voltage relates to electrolyte specific gravity (OCV ≈ SG + 0.845 per cell). No pack voltage is invented here.",
    },
    {
        "id": "this_app",
        "name": "Original structured diagnostic procedure written for this app",
        "url": "",
        "license": "generated-general / original wording; not a vehicle-specific service procedure",
        "used_for": "Step-by-step tests and fix steps. Numeric limits come from the vehicle service manual unless a test cites a value above.",
    },
    {
        "id": "service_manual",
        "name": "Vehicle service manual for exact test values, torque, and pinouts",
        "url": "",
        "license": "manufacturer documentation (not reproduced)",
        "used_for": "Any vehicle-specific specification, torque, wiring diagram, or fluid type.",
    },
]

ENTRIES: list[dict] = []


def T(tool, check, good, bad, spec=MANUAL):
    return {"tool": tool, "check": check, "good": good, "bad": bad, "spec": spec}


def C(title, likelihood, tests, fix):
    if not tests:
        raise ValueError(f"cause has no tests: {title}")
    if isinstance(fix, str):
        fix = [fix]
    return {"title": title, "likelihood": likelihood, "tests": tests, "fix": fix}


def add(entry: dict):
    required = ("id", "system", "title", "symptom", "tier", "sources", "causes")
    for key in required:
        if key == "sources":
            if "sources" not in entry or entry["sources"] is None:
                raise ValueError(f"missing {key} on {entry.get('id')}")
            continue
        if not entry.get(key):
            raise ValueError(f"missing {key} on {entry.get('id')}")
    if not entry.get("means"):
        text = str(entry.get("symptom") or "")
        entry["means"] = text
        parts = text.split(". ", 1)
        if len(parts) == 2 and 40 <= len(parts[0]) <= 240:
            entry["symptom"] = parts[0].rstrip(".") + "."
    if entry["tier"] not in ("cited", "generated-general"):
        raise ValueError(entry["id"])
    if "this_app" not in entry["sources"]:
        entry["sources"] = list(entry["sources"]) + ["this_app"]
    if "service_manual" not in entry["sources"]:
        entry["sources"] = list(entry["sources"]) + ["service_manual"]
    entry.setdefault("keywords", [])
    entry.setdefault("audience", ["automotive"])
    entry.setdefault("cdi_workflow", False)
    entry.setdefault("safety", [])
    entry.setdefault("difficulty", "moderate")
    entry.setdefault("time", "30–90 minutes to test; repair time depends on what the tests find")
    entry.setdefault("tools", ["Scan tool with live data if the vehicle has OBD", "Multimeter", "Flashlight"])
    entry.setdefault("parts", ["Replace a part only after the tests for that cause fail; match the part to this vehicle"])
    entry.setdefault("related_dtcs", [])
    entry.setdefault("related_jobs", [])
    ENTRIES.append(entry)


# Shared safety strings
SAFE_FUEL = "Fuel system: no sparks or open flame. Relieve pressure and work with a fire extinguisher nearby, following the service manual. Do evap or tank work in a ventilated area."
SAFE_COOL = "Cooling: never remove a hot cap. A scalding system can vent steam and coolant. Let it cool completely, then follow the service-manual relief procedure."
SAFE_BRAKE = "Brakes / ABS: support the vehicle safely on jack stands, never a jack alone. Do not drive if braking feel, a dragging caliper, or a warning lamp says the system is compromised."
SAFE_SRS = "SRS / airbag: disconnect the battery and wait the time the service manual calls for before unplugging yellow connectors. Do not probe airbag circuits with a test light."
SAFE_HV = "High voltage (hybrid / EV): orange cables and high-voltage connectors are not a driveway probe job. Have the high-voltage system isolated per the service manual, or leave this to a qualified technician."
SAFE_JACK = "Support the vehicle on jack stands on level ground. Chock a wheel. Never work under a vehicle held only by a jack."
SAFE_BATT = "Disconnect the negative battery cable first when the job calls for it, and isolate it so it cannot spring back onto the post. The big B+ cable is hot with the key off."
SAFE_EXHAUST = "Exhaust and catalytic converters get hot enough to burn skin and start a fire in dry grass. Let the system cool. Work in a ventilated area; exhaust gas is poisonous."
SAFE_RUNNING = "Keep hands, hair, and clothing clear of belts, fans, and the cooling fan, which can start without warning on a hot engine."
SAFE_2STROKE = "Two-stroke engines can seize if run without oil in the mix. Do not restart a seized or dry-scored engine just to 'see if it pops.'"
SAFE_CLUTCH = "A snowmobile or CVT clutch can throw parts at high speed. Do not service a rotating clutch. Remove the belt only with the engine stopped, following the service manual."

# Shared tests
def scan_codes(extra=""):
    return T(
        "Scan tool (Mode 03 / pending / freeze-frame, plus live data)",
        "With the key on, read stored and pending codes and note freeze-frame (engine warm? load? rpm?). " + extra,
        "No related codes, or a stored code whose freeze-frame matches this symptom and gives a starting circuit",
        "A hard code, a pending misfire, a fuel-trim or sensor code, or an empty scan when a warning lamp is on — follow that family before guessing at parts",
    )

def visual_leak(where="under the vehicle and around the component"):
    return T(
        "Flashlight and a clean paper towel or cardboard",
        f"Look {where} for wetness, crust, or a fresh drip. Note color and whether it is oily, watery, or sticky.",
        "Dry, or only a faint old stain that is not growing",
        "A fresh wet spot, a drip, or a crusted trail you can trace to a hose, gasket, or housing",
    )

def fluid_level(name, how):
    return T(
        "The vehicle's dipstick or sight reservoir, on level ground",
        how,
        f"{name} is in the marked range, clean enough to read, and the cap/stick seats correctly",
        f"{name} is low, overfull, milky, burnt, glittery, or missing — do not ignore a low reading",
    )

def connector_tug(part):
    return T(
        "Flashlight and gloved hands; dielectric grease only if the manual allows it",
        f"With the battery disconnected if the manual requires it, inspect the {part} connector for corrosion, backed-out pins, or a loose lock. Tug the housing, don't pull the wires.",
        "Clean, fully seated, lock engaged, no green corrosion or moisture",
        "Corrosion, a loose lock, a pin that slides back, or a connector that falls off in your hand",
    )

def multimeter_power(part):
    return T(
        "Digital multimeter",
        f"Back-probe power and ground at {part} as the service manual shows (key state and connector on or off per the diagram).",
        "Power and ground both present when they should be, and neither is present when the circuit should be off",
        "No power, no ground, power on the wrong pin, or a large drop compared with battery voltage — repair the circuit before condemning the part",
        MANUAL,
    )

def wiggle_harness(part):
    return T(
        "Helper plus a scan tool or a test lamp / multimeter, as the circuit allows",
        f"With the symptom present or monitored, gently wiggle the harness and connector at {part} and along obvious chafe points.",
        "The reading or the running condition does not change when the harness moves",
        "The symptom, a code, or the live reading comes and goes when the harness moves — repair the wiring; a new part will fail the same way",
    )

# ---------------------------------------------------------------------------
# Engine / no-start / won't crank
# ---------------------------------------------------------------------------
add(dict(
    id="eng-no-crank-silent",
    system="engine_no_start",
    title="Won't crank — silent, no click",
    symptom="Key to Start (or start button) produces no starter sound and no solenoid click. Lights may be dead or unusually dim.",
    means="The starter never receives a command, or the battery and main cables cannot deliver current. FTC Auto Repair Basics warns that a 'dead starter' is often a dead battery or a poor connection — prove the battery and cables first.",
    keywords=["no crank", "silent", "no click", "dead", "won't start", "no start"],
    tier="cited",
    sources=["ftc_basics", "doe_battery"],
    safety=[SAFE_BATT, SAFE_JACK],
    difficulty="easy",
    time="20–60 minutes to test; cable or battery work varies",
    tools=["Digital multimeter", "Test light", "Terminal brush", "Flashlight", "Helper"],
    related_dtcs=["P0562", "P0685", "U0100"],
    related_jobs=["starter"],
    causes=[
        C("Discharged or failed battery, or corroded terminals", "high", [
            T("Digital multimeter, after the battery has rested off chargers and heavy loads",
              "Measure open-circuit voltage across the clean battery posts, not the cable clamps. Then have a helper try to crank while you watch voltage at the posts.",
              "Rested voltage is in the service-manual charged range, and voltage does not collapse to a useless number while cranking",
              "Rested voltage is low, or it collapses as soon as the key is turned — charge and load-test the battery, and clean the terminals, before condemning the starter",
              SPEC_DOE_OCV),
            T("Eyes and a terminal brush",
              "Inspect both terminals and the cable ends for green or white corrosion, a loose clamp, or a broken strand at the crimp.",
              "Clean, tight clamps on bright metal, cables not crumbling at the ends",
              "Corrosion, a spin-on-the-post clamp, or a broken cable — clean or replace; a new starter will still be silent"),
        ], "Clean and tighten the terminals. Charge and load-test the battery. Replace the battery only if it fails a proper test. Then retest the no-crank."),
        C("Open or high-resistance ground or B+ cable", "high", [
            T("Digital multimeter and a helper",
              "Measure voltage drop on the positive path (battery post to starter B+ stud) and on the ground path (battery negative post to engine block) while someone holds Start.",
              "Drop on each path stays within the service-manual limit (often a fraction of a volt — use the manual, not a guessed number)",
              "A large drop, a cable that is warm, or almost no voltage at the starter stud — repair the cable or ground; do not replace the starter yet",
              MANUAL),
        ], "Repair or replace the damaged cable or ground strap. Clean the engine-block and chassis ground points to bare metal and retighten to the manual."),
        C("Range switch, clutch interlock, or start-button module not closing", "medium", [
            T("Scan tool live data and a helper, plus the shifter or clutch pedal",
              "Confirm Park or Neutral (automatic) or a fully depressed clutch (manual). Watch the clutch/range input on live data if the scan tool shows it, and try Neutral as well as Park.",
              "The interlock input shows closed, and the engine cranks in the gear the manual says should crank",
              "It cranks in Neutral but not Park (or the clutch switch never changes state) — adjust or replace the switch or cable, not the starter"),
        ], "Adjust or replace the range or clutch switch and its cable. Verify the shift interlock after the repair."),
        C("No start signal at the starter solenoid trigger (relay, fuse, ignition switch, or module)", "medium", [
            T("Digital multimeter or a test light, service-manual wiring diagram",
              "During a start attempt, check for the trigger voltage at the starter solenoid's small terminal and at the starter relay output.",
              "The trigger is present at the solenoid during Start",
              "Relay clicks but no output, a dead fuse, or no trigger at the solenoid — diagnose the relay, fuse, ignition switch, or start-control circuit",
              MANUAL),
        ], "Replace a failed fuse, relay, or ignition switch only after the test names it. Confirm the starter itself only if the trigger is present and the battery and cables already passed."),
    ],
))

add(dict(
    id="eng-no-crank-single-click",
    system="engine_no_start",
    title="Won't crank — single click",
    symptom="Key to Start produces one click from the starter or solenoid area, then nothing. Headlights may stay bright or may dip.",
    means="The solenoid is trying to engage, but the motor does not spin the engine. That can be a weak battery or cable (the click is all the current can do) or a failed starter. FTC: test the battery and connections before repairing the starter.",
    keywords=["no crank", "click", "solenoid", "starter", "single click"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BATT, SAFE_JACK],
    difficulty="moderate",
    time="30–90 minutes to test; starter replacement 1–3 hours on many trucks",
    tools=["Digital multimeter", "Helper", "Jack and stands if the starter is reached from below", "Flashlight"],
    related_dtcs=["P0562"],
    related_jobs=["starter"],
    causes=[
        C("Weak battery or poor cable making the solenoid click only", "high", [
            T("Headlights plus a digital multimeter and a helper",
              "Lights on, key to Start. Watch the lights and measure voltage at the battery posts and at the starter B+ stud during the click.",
              "Lights stay reasonably bright and voltage at the starter stud stays in the cranking range the manual lists",
              "Lights go dead, or there is a large drop between the battery post and the starter stud — fix the battery or cable first",
              MANUAL),
        ], "Charge and load-test the battery; repair a high-resistance cable. Only then decide whether the starter still clicks."),
        C("Starter motor or solenoid failed internally", "medium", [
            T("Digital multimeter at the starter, battery already proven",
              "With a proven battery and cables, confirm B+ at the starter stud and trigger at the small terminal during the click.",
              "If power and trigger are present and the engine still does not turn, the starter is at fault",
              "Missing power or trigger means the starter has not been proven yet",
              MANUAL),
        ], "Support and replace the starter with the unit that matches this engine and bellhousing. Torque the bolts to the service manual."),
        C("Engine mechanically seized or a hydrostatic lock (coolant or fuel in a cylinder)", "low", [
            T("Breaker bar on the crank bolt, or a careful attempt to turn the engine by hand per the manual; remove the plugs if a liquid lock is possible",
              "With the battery disconnected, try to rotate the engine the manual's way. If a plug hole sprays liquid, stop.",
              "The engine rotates smoothly by hand",
              "It will not budge, or liquid comes out of a plug hole — do not keep hitting the starter"),
        ], "Find why it is locked (failed head gasket, leaking injector, hydrolock) and repair that before installing another starter."),
    ],
))

add(dict(
    id="eng-no-crank-rapid-click",
    system="engine_no_start",
    title="Won't crank — rapid clicking",
    symptom="Key to Start produces a rapid series of clicks, usually from the starter solenoid or a starter relay. Lights often dim in time with the clicks.",
    means="The solenoid is pulling in and dropping out because available voltage collapses. This is almost always a battery, terminal, or cable problem, not a 'bad starter' as the first guess. FTC: corroded or loose terminals can make a battery appear dead.",
    keywords=["rapid click", "chatter", "solenoid", "no crank", "weak battery"],
    tier="cited",
    sources=["ftc_basics", "doe_battery"],
    safety=[SAFE_BATT],
    difficulty="easy",
    time="15–45 minutes to test",
    tools=["Digital multimeter", "Terminal brush", "Helper"],
    related_dtcs=["P0562"],
    related_jobs=["starter"],
    causes=[
        C("Discharged battery or dirty, loose terminals", "high", [
            T("Digital multimeter on the posts, plus a close look at the clamps",
              "Measure rested open-circuit voltage on the posts. Watch voltage during the clicking. Inspect and clean both terminals.",
              "After a proper charge and clean connections, voltage stays usable during a start attempt and the clicking stops",
              "Voltage is low or collapses in time with the clicks, or the clamps are green and loose",
              SPEC_DOE_OCV),
        ], "Clean the terminals. Charge and load-test the battery. Replace the battery only if it fails the test."),
        C("High-resistance positive or ground cable", "medium", [
            T("Digital multimeter voltage-drop test with a helper holding Start",
              "Measure drop from battery post to starter B+ and from battery negative to the block during the chatter.",
              "Drops stay within the service-manual limit",
              "A large drop that appears only under that load — repair the cable or ground",
              MANUAL),
        ], "Replace or repair the cable. Clean ground eyelets to bare metal."),
    ],
))

add(dict(
    id="eng-cranks-no-start",
    system="engine_no_start",
    title="Cranks normally but will not start",
    symptom="The starter turns the engine at a normal speed, but the engine never catches and runs. No start after several attempts.",
    means="A running engine needs spark, fuel, and compression in time with each other, plus a module that knows crank position. The job is to find which of those is missing, not to throw parts at it. FTC lists difficulty starting as an engine symptom that needs a real diagnosis.",
    keywords=["cranks no start", "won't start", "no start", "turns over"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_FUEL, SAFE_BATT, SAFE_RUNNING],
    difficulty="moderate",
    time="45–120 minutes to isolate spark, fuel, or compression",
    tools=["Scan tool", "Spark tester", "Fuel-pressure gauge (correct adapter)", "Compression or relative-compression method per the manual", "Multimeter"],
    related_dtcs=["P0335", "P0340", "P0230", "P0191", "P0351"],
    causes=[
        C("No spark (ignition coil, crank/cam sensor, or module not firing)", "high", [
            scan_codes("A crank- or cam-sensor code, or no rpm PID while cranking, points at the sensor or its wiring."),
            T("In-line spark tester, not a screwdriver to ground",
              "Connect a proper spark tester on a plug wire or coil-on-plug adapter the manual allows, and crank.",
              "A crisp spark in the tester on each event",
              "No spark, or rpm PID stays at zero while cranking — diagnose the crank/cam sensor, coil power, and module before replacing injectors"),
        ], "Repair the sensor, wiring, coil, or module the tests name. Recheck spark before moving to fuel."),
        C("No fuel delivery (empty tank, pump, relay, fuse, or a severe restriction)", "high", [
            T("Fuel-pressure gauge on the service-manual test port, or a scan-tool fuel-pump command if the vehicle has one",
              "Listen for the pump prime with the key on. Measure pressure at rest and while cranking. Confirm the tank actually has fuel.",
              "Pump primes, and pressure is in the service-manual range while cranking",
              "No prime, a dead fuel-pump fuse or relay, or pressure far below the manual — fix delivery before replacing spark parts",
              MANUAL),
        ], "Replace a failed fuse, relay, pump, or filter only after the pressure test names it. Relieve pressure safely before opening the system."),
        C("No or low compression, or a jumped timing chain/belt", "medium", [
            T("Compression gauge or the manual's relative-compression / running-compression method; also inspect timing marks if the engine has them",
              "Disable fuel and spark as the manual requires. Measure compression on all cylinders, or compare cranking current, and check cam/crank correlation if a scan tool can do it.",
              "Compression and cam/crank correlation are within the service-manual range on every cylinder",
              "All cylinders low, one cylinder at zero, or a correlation error — do not keep flooding the engine",
              MANUAL),
        ], "Repair the timing components, head gasket, or the mechanical damage the measurements show. Use the service-manual timing procedure."),
        C("Immobilizer, anti-theft, or a missing key/fob authorization", "medium", [
            T("Scan tool and a look at the security lamp",
              "Note whether a security or immobilizer lamp stays on or flashes during the crank. Read body/immobilizer codes.",
              "Security lamp behaves as the manual describes for an authorized key, and no immobilizer code is stored",
              "A flashing security lamp, an immobilizer code, or a fob the vehicle does not recognize — follow the anti-theft diagnostic, not a parts-cannon on coils"),
        ], "Use a known-good programmed key and the service-manual immobilizer procedure. Do not bypass theft systems in a way the law or the vehicle forbids."),
    ],
))

add(dict(
    id="eng-starts-then-dies",
    system="engine_no_start",
    title="Starts, then dies within a few seconds",
    symptom="The engine fires and may run for one to several seconds, then stalls and will not stay running unless the key is cycled again.",
    means="Initial fuel and spark are present, but a prime-only pump, a security cut, a severe vacuum leak, or a sensor the module needs after start is dropping out.",
    keywords=["starts and dies", "stalls immediately", "won't stay running"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL, SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=["P0171", "P0335", "P0340", "P0230"],
    causes=[
        C("Fuel pump runs only on the key-on prime, then stops", "high", [
            T("A helper at the key, you listening at the tank or watching fuel pressure",
              "Note whether the pump (or fuel pressure) dies at the same moment the engine stalls.",
              "Pump and pressure stay in the manual's running range after start",
              "Pressure peaks on prime and falls to zero as the engine dies — diagnose the pump relay, inertia switch, module command, or the pump itself",
              MANUAL),
        ], "Repair the relay, inertia/cut-off switch, wiring, or pump the test identifies. Recheck that pressure holds after start."),
        C("Immobilizer allows a brief start, then cuts spark or fuel", "medium", [
            T("Scan tool and the security lamp",
              "Watch the security lamp and immobilizer status during the brief run.",
              "No theft-related code and the lamp behaves as an authorized start",
              "A theft code or a lamp that goes into the 'not authorized' pattern as the engine dies"),
        ], "Follow the service-manual immobilizer diagnostic with a programmed key."),
        C("Large vacuum leak or a failed idle-air path after start", "medium", [
            T("Scan tool (fuel trims, rpm) and a careful listen for a hiss, with the engine briefly running if it is safe",
              "If the engine will idle for a moment, note a very high idle or a hiss at the intake, brake booster, or PCV.",
              "Idle and trims are in a normal range and there is no hiss",
              "A loud hiss, a rapidly climbing idle, or extreme positive fuel trims"),
        ], "Repair the disconnected hose, failed gasket, or booster leak. Do not use open flame to find a vacuum leak."),
    ],
))

add(dict(
    id="eng-hard-start-cold",
    system="engine_no_start",
    title="Hard start when cold",
    symptom="The engine cranks a long time before starting after it has sat in the cold, then may idle roughly until it warms. Warm restarts are easier.",
    means="Cold starts need the correct enrichment or glow-plug heat (diesel), a battery that can still crank slowly in the cold, and sensors that tell the module the engine is actually cold.",
    keywords=["hard start", "cold start", "long crank", "morning"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_FUEL, SAFE_BATT],
    difficulty="moderate",
    related_dtcs=["P0112", "P0113", "P0117", "P0118", "P0335"],
    causes=[
        C("Weak battery that still starts the vehicle once it is warm", "high", [
            T("Digital multimeter at the posts during a cold crank, then a load or conductance test",
              "Measure cranking voltage on a cold morning and compare it with the service-manual cranking limit.",
              "Cranking voltage stays in the manual's range and the engine spins at a normal speed",
              "A slow grind and voltage well below the manual — charge and load-test; cold weather exposes a weak battery",
              MANUAL),
        ], "Charge and load-test. Replace the battery if it fails, using the size and specification the vehicle calls for."),
        C("Coolant-temperature sensor reading incorrectly (module thinks the engine is warm)", "high", [
            T("Scan tool live data, cold engine",
              "With the engine cold, compare the reported coolant temperature to a reasonable ambient temperature.",
              "The reported temperature is close to actual cold ambient",
              "The PID already shows a fully warm engine when the block is cold — test the sensor and wiring per the manual"),
        ], "Repair the sensor or wiring. Confirm a cold start after the PID reads correctly."),
        C("Low fuel pressure, leaking injectors, or (diesel) weak glow plugs", "medium", [
            T("Fuel-pressure gauge and, on diesel, a glow-plug current or resistance check per the manual",
              "Measure prime and cranking pressure. On diesel, test glow-plug operation the manual's way — do not guess ohms.",
              "Pressure and glow-plug operation meet the service manual on a cold start",
              "Pressure bleeds down overnight, or glow plugs do not heat — repair that family",
              MANUAL),
        ], "Repair the pump, check valve, injector leak-down, or glow-plug circuit the test names."),
    ],
))

add(dict(
    id="eng-hard-start-hot",
    system="engine_no_start",
    title="Hard start when hot",
    symptom="The engine starts reasonably when cold, but after a hot soak (short stop on a hot day) it cranks a long time or has to be feathered to start.",
    means="Heat can raise fuel pressure bleed-down, vaporize fuel in a weak pump or a hot line, or upset a coolant or air-temperature sensor. Prove pressure and sensor data on a hot soak, not just on a cold bay.",
    keywords=["hard start", "hot start", "heat soak", "vapor lock"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL, SAFE_COOL, SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=["P0191", "P0087", "P0113"],
    causes=[
        C("Fuel pressure bleeds down during a hot soak", "high", [
            T("Fuel-pressure gauge left connected for a safe hot-soak retest, following the manual's relief and safety steps",
              "Record running pressure, shut down, wait through the soak that causes the symptom, and watch residual pressure. Then crank.",
              "Residual pressure stays in the manual's hold-time range and the engine restarts normally",
              "Pressure falls to zero during the soak and the hot start is long — look at a check valve, pump, or leaking injector",
              MANUAL),
        ], "Repair the valve, pump, or injector leak-down the gauge showed. Do not open a pressurized fuel system until it is relieved."),
        C("Sensor or idle-control problem that appears only when hot", "medium", [
            scan_codes("Capture live ECT, IAT, and fuel trims during the failed hot start."),
            T("Scan tool on a hot restart attempt",
              "Compare sensor readings with the actual hot engine and watch idle command.",
              "Sensors and idle command make sense for a hot restart",
              "A clearly impossible temperature or a flat idle command during the long crank"),
        ], "Repair the sensor, wiring, or idle control the live data named."),
    ],
))

add(dict(
    id="eng-stalls-idle",
    system="engine_no_start",
    title="Stalls at idle",
    symptom="The engine dies when you come to a stop or when sitting at idle, but it may run acceptably once moving. FTC lists stalling and rough idle as engine trouble that needs a diagnosis.",
    keywords=["stall", "idle", "dies at stop", "rough idle"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING, SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=["P0506", "P0507", "P0171", "P0401"],
    causes=[
        C("Unmetered air (vacuum leak, PCV, or a dirty idle-air / throttle body)", "high", [
            T("Scan tool fuel trims at idle versus a raised rpm, plus a careful listen or a smoke machine at the intake if you have one",
              "Note trims at idle and at 2,000 rpm. Listen for a hiss. Do not use open flame.",
              "Trims stay modest at idle and there is no hiss",
              "Large positive trims at idle that shrink when rpm rises, or an audible leak — find the hose, gasket, or PCV path"),
        ], "Repair the leak or clean the throttle / idle path only as the manual allows. Recheck idle and trims."),
        C("EGR or a control valve stuck slightly open at idle", "medium", [
            T("Scan tool EGR command/position and a visual or the manual's functional test",
              "At idle, confirm the valve is commanded closed and actually closed.",
              "Closed at idle, and idle stabilizes when the valve is verified closed",
              "The valve is off its seat at idle or idle cleans up when the valve is forced closed per the manual",
              MANUAL),
        ], "Clean or replace the EGR valve or its passage as the test indicates, using the gasket and torque the manual lists."),
        C("Fuel pressure or a dirty injector that only shows at low load", "medium", [
            T("Fuel-pressure gauge at idle and a scan-tool misfire or fuel-trim view",
              "Measure idle pressure and watch for a single-cylinder contribution problem.",
              "Pressure is in the idle range the manual lists, and no one cylinder is dragging idle down",
              "Low idle pressure or one cylinder that is clearly weak at idle",
              MANUAL),
        ], "Repair the pump, regulator, or the injector the test identified."),
    ],
))

add(dict(
    id="eng-stalls-driving",
    system="engine_no_start",
    title="Stalls while driving",
    symptom="The engine dies on the move — sometimes as if the key were turned off — and may or may not restart immediately.",
    means="A sudden stall underway is often ignition power, a crank-sensor drop-out, a fuel-pump interrupt, or a severe misfire the module shuts down around. Capture a code and freeze-frame if you can, and do not keep driving a vehicle that dies in traffic without a plan to get it off the road safely.",
    keywords=["stall", "dies while driving", "cuts out", "intermittent stall"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_FUEL, "If the engine dies in traffic, get somewhere safe before further tests. Do not troubleshoot in a live lane."],
    difficulty="moderate",
    related_dtcs=["P0335", "P0230", "P0685", "U0100"],
    causes=[
        C("Intermittent crankshaft or camshaft sensor, or a broken reluctor", "high", [
            scan_codes("Pending crank/cam codes or a freeze-frame at the stall speed are important even if the light is not on now."),
            wiggle_harness("the crank or cam sensor"),
            T("Scan tool rpm PID during a road test in a safe place, or a scope if you have one",
              "Watch rpm at the moment of the stall.",
              "Rpm decays the way a dying engine should, and the sensor keeps reporting",
              "Rpm drops instantly to zero while the engine is still spinning down — the module lost the sensor"),
        ], "Repair the sensor, connector, harness, or the reluctor/tone ring the inspection finds. Use the air-gap or fastener torque in the service manual."),
        C("Fuel pump, relay, or inertia switch dropping out", "high", [
            T("Fuel-pressure gauge or a safe current/probe on the pump circuit during a controlled road test",
              "Watch whether pressure or pump current vanishes at the stall.",
              "Pressure holds in the driving range the manual lists",
              "Pressure or pump current disappears at the stall, then may return after a key cycle",
              MANUAL),
        ], "Repair the pump, relay, inertia switch, or wiring. Recheck over the same driving condition."),
        C("Main power, ground, or ignition-switch dropout to the engine module", "medium", [
            T("Multimeter or a mid-session recording tool on module power and ground, plus a wiggle of the ignition switch and main relays",
              "Monitor module power during the stall condition.",
              "Power and ground stay solid",
              "Power blips or a relay chatters as the engine dies"),
        ], "Repair the relay, ignition switch, or power/ground distribution the test names."),
    ],
))

add(dict(
    id="eng-low-power",
    system="engine_no_start",
    title="Poor acceleration or low power under load",
    symptom="The engine runs, but it is flat on takeoff, on a grade, or when passing. FTC lists poor acceleration as an engine symptom that needs a diagnosis.",
    keywords=["low power", "poor acceleration", "no power", "sluggish", "can't climb"],
    tier="cited",
    sources=["ftc_basics", "fueleconomy"],
    safety=[SAFE_RUNNING, SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=["P0299", "P0101", "P0171", "P0234"],
    causes=[
        C("Restricted air filter, collapsed intake hose, or a clogged exhaust", "high", [
            T("Eyes on the air filter and intake tube; a careful check for an exhaust that is unusually hot or a rattling converter",
              "Inspect the filter, the tube between the meter and the throttle, and whether the exhaust is blocked (the engine may grunt or the pipe may be barely flowing).",
              "Filter is serviceable, the intake tube is intact, and exhaust flows",
              "A packed filter, a collapsed boot, or an exhaust that is clearly plugged — fix that before chasing sensors"),
        ], "Replace the filter or the damaged boot. A plugged catalytic converter is a professional exhaust job; do not keep driving a severely restricted engine."),
        C("Fuel delivery that falls off under load", "high", [
            T("Fuel-pressure gauge and scan-tool load data during a safe, brief loaded acceleration",
              "Watch pressure as load rises.",
              "Pressure stays in the loaded range the manual lists",
              "Pressure sags as you accelerate and the engine goes flat",
              MANUAL),
        ], "Repair the pump, filter, or regulator the gauge named. Use the correct fuel filter and pressure spec from the manual."),
        C("Turbo or supercharger underboost, or a boost leak (if equipped)", "medium", [
            T("Scan tool desired vs actual boost, and a careful inspection of charge pipes and clamps",
              "Compare commanded and actual boost on a short load, and feel or spray (soapy water, never flame) for a leak on the charge pipes.",
              "Actual boost follows the command, and the pipes stay tight",
              "A large gap between desired and actual boost, or a hissing charge pipe",
              MANUAL),
        ], "Repair the leak, wastegate, or the turbo the tests indicate. A failed turbo can send debris through the engine — inspect before installing a replacement."),
        C("Ignition timing, dragging brakes, or a transmission that will not downshift", "medium", [
            T("A safe road test plus a look at the brakes and a scan of shift and timing PIDs (FuelEconomy.gov lists dragging brakes and shift problems among poor-economy / poor-performance checks)",
              "After a short drive, carefully feel whether a wheel is burning hot. Watch whether the transmission actually downshifts on a grade.",
              "Brakes are not dragging, and the transmission uses the gears the manual describes",
              "A smoking or very hot wheel, or the engine is lugging in a high gear"),
        ], "Repair the dragging brake or the shift problem. Do not ignore a hot wheel — see the brake entries."),
    ],
))

add(dict(
    id="eng-poor-economy",
    system="engine_no_start",
    title="Unusually poor fuel economy",
    symptom="Fuel use is clearly worse than this vehicle's normal history, not just different from the window-sticker number. FuelEconomy.gov lists the checks a shop typically runs when economy is excessively low.",
    means="After you rule out a change in driving, load, or fuel, look for a stored emissions code, dragging brakes, a slipping transmission, low tire pressure, a dirty air filter, ignition problems, or a fuel or vacuum leak. Those checks come from the DOE/EPA FuelEconomy.gov FAQ.",
    keywords=["fuel economy", "poor mpg", "uses too much gas", "mileage"],
    tier="cited",
    sources=["fueleconomy", "nhtsa_tires", "epa_obd"],
    safety=[SAFE_FUEL, SAFE_BRAKE],
    difficulty="moderate",
    time="45–120 minutes for the checklist; repairs vary",
    related_dtcs=["P0172", "P0420", "P0442", "P0300"],
    causes=[
        C("A stored emissions or engine code that has not been read", "high", [
            scan_codes("FuelEconomy.gov starts an excessively-low-economy diagnosis with an OBD system check."),
        ], "Diagnose the stored code with the code-specific tests in this app, then recheck economy."),
        C("Low tire pressure or dragging brakes", "high", [
            T("Accurate tire gauge, tires cold",
              "Measure all four (and the spare if the vehicle uses it as a full-size). Compare with the door sticker.",
              "Every tire is at the door-sticker pressure when cold",
              "One or more tires are clearly low — inflate and find why it lost air",
              SPEC_TIRE_COLD),
            T("Safe road test, then a careful hand near (not on) each wheel and a look at the rotors",
              "After a short unbraked stretch, check for a wheel that is much hotter than the others or a smell of hot brakes.",
              "Wheel temperatures are similar and no brake is smoking",
              "One wheel is markedly hotter — see the stuck-brake entries; do not keep driving it"),
        ], "Set pressure to the door sticker. Repair a dragging brake before blaming the engine."),
        C("Transmission slipping, not using all gears, or lock-up not working", "medium", [
            T("Safe road test and scan-tool shift / TCC data if available",
              "Note flare between gears, a high rpm cruise, or a lock-up that never applies.",
              "Shifts are timely and cruise rpm is normal for this vehicle",
              "Slip, missing gears, or a converter that never locks — see the transmission entries"),
        ], "Repair the shift or lock-up problem. Check fluid condition first, without assuming a rebuild."),
        C("Dirty air filter, vacuum leak, weak ignition, or the wrong fuel", "medium", [
            T("Eyes on the air filter, a listen for vacuum leaks, a look at the plugs if they are due, and a check of the fuel you have been buying",
              "Work through the FuelEconomy.gov items: air cleaner, vacuum hoses, ignition condition, and fuel quality.",
              "Filter, hoses, and ignition look serviceable, and the fuel is the grade the owner's manual calls for",
              "A packed filter, split vacuum hose, worn plugs, or the wrong octane or a bad tank of fuel"),
        ], "Service the item the inspection failed. Recheck economy over a few filled tanks, same route if you can."),
    ],
))

add(dict(
    id="eng-runs-on",
    system="engine_no_start",
    title="Engine keeps running after the key is off",
    symptom="Turning the key off (or pressing stop) does not shut the engine down immediately, or it diesels / runs on for a few seconds. FTC lists 'engine continues running after the key is removed' as engine trouble.",
    keywords=["run on", "dieseling", "won't shut off", "key off still running"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING, "If you cannot shut it down with the key, use the service-manual emergency stop (often the starter fuse, inertia switch, or a safe disconnect). Keep clear of belts and the cooling fan."],
    difficulty="moderate",
    related_dtcs=["P0335"],
    causes=[
        C("Ignition or pump power that stays hot (stuck relay or a shorted switch)", "high", [
            T("Scan tool or a test light on ignition-power and fuel-pump relays when you turn the key off",
              "Watch whether a relay stays clicked in or a power feed remains hot after key-off.",
              "Ignition and pump power drop when the key is off, and the engine dies promptly",
              "A relay stays pulled in or a feed stays hot — replace that relay or repair the switch/circuit"),
        ], "Replace the stuck relay or repair the ignition-switch circuit. Confirm a clean shutdown."),
        C("Dieseling from carbon, a high idle, or the wrong heat range (mostly older gasoline engines)", "medium", [
            T("Observe idle speed just before shutdown and inspect for a heavy carbon buildup if the manual has a procedure",
              "Note whether idle is abnormally high and whether the run-on sounds like dieseling rather than a powered-up engine.",
              "Idle is normal and the engine stops as soon as power is removed",
              "A very high idle or a classic dieseling shudder after power is removed"),
        ], "Correct the idle, use the fuel grade the manual calls for, and address carbon only with a method the service manual allows."),
    ],
))

add(dict(
    id="eng-flooded-start",
    system="engine_no_start",
    title="Gasoline smell after a failed start — possible flood or a fuel leak",
    symptom="A start attempt fails and you smell raw gasoline. FTC: the smell of gasoline vapors after a failed start may mean a flooded engine — wait a few minutes and try again. If the odor persists, a fuel leak is possible and needs immediate attention.",
    keywords=["flooded", "gasoline smell", "failed start", "raw fuel"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_FUEL, "If you smell a strong, persistent fuel odor, stop cranking. Look for a wet leak. Do not start or jump the vehicle until a leak is ruled out."],
    difficulty="easy",
    related_dtcs=["P0172", "P0201", "P0455"],
    related_jobs=[],
    causes=[
        C("Flooded engine from repeated cranking", "high", [
            T("Nose and a look at the tailpipe or plugs only if it is safe and the manual allows a plug inspection",
              "After a failed start with a raw-fuel smell but no wet leak under the hood or on the ground, wait several minutes as FTC describes, then try one start with the manual's clear-flood procedure if it has one (often a full-throttle crank on fuel-injected engines).",
              "The engine starts after a wait or a proper clear-flood crank, and the smell fades",
              "It remains soaked, or the smell does not fade — look for leaking injectors or a leaking line, and stop using the starter"),
        ], "Use the manual's clear-flood procedure. If plugs are wet with fuel, dry or replace them as the manual allows. Find why it flooded (open injector, no spark) before more cranking."),
        C("A fuel leak — not just a flooded intake", "high", [
            visual_leak("along fuel lines, the rail, the filter, and under the tank"),
            T("Eyes and nose, engine off, battery not being jumped",
              "Look for wet fuel, a drip, or a strong smell that continues after the failed start has had time to clear.",
              "No wet fuel, and the smell fades after a short wait",
              "A wet line, a dripping filter, or a puddle — this is a fire risk; do not crank"),
        ], "Repair the leaking line, clamp, rail, or tank component. Do not drive until the leak is fixed."),
    ],
))

add(dict(
    id="eng-excessive-oil-use",
    system="engine_no_start",
    title="Uses more than a quart of oil between changes",
    symptom="You add oil more often than a quart between regular changes, or the level drops quickly. FTC lists excessive oil use (more than one quart between changes) as engine trouble that needs a diagnosis.",
    keywords=["burns oil", "oil consumption", "adds oil", "quart", "blue smoke"],
    tier="cited",
    sources=["ftc_basics", "oregon_smoke"],
    safety=[SAFE_RUNNING, SAFE_EXHAUST],
    difficulty="advanced",
    related_dtcs=["P0430", "P0171"],
    causes=[
        C("External leak mistaken for burning", "high", [
            visual_leak("at the valve covers, oil-pan gasket, rear main area, and the filter or cooler lines"),
        ], "Repair the leak you can see before assuming the engine burns oil internally."),
        C("Oil burned in the combustion chamber (rings, valves, or a leaking turbo)", "medium", [
            T("Eyes on the tailpipe after a highway run, and a plug inspection if the manual allows it",
              "Look for blue-gray smoke, especially on deceleration or after an idle (see the smoke-color entries). Check plugs for oil fouling.",
              "No blue smoke and the plugs are not oil-fouled",
              "Blue smoke or oil-wet plugs — compression or leak-down per the manual is next"),
            T("Compression or leak-down tester, service-manual procedure",
              "Measure all cylinders and compare with the manual's minimum and variation limits.",
              "All cylinders are in the manual's range",
              "Low or uneven cylinders — the engine may need a mechanical repair, not just thicker oil",
              MANUAL),
        ], "If leak-down points at rings or valves, this is a mechanical repair. A leaking turbo oil seal is a turbo job. Do not 'just add stop-leak' as a diagnosis."),
    ],
))
print("engine group", len(ENTRIES))

# ---------------------------------------------------------------------------
# Misfire
# ---------------------------------------------------------------------------
add(dict(
    id="mis-flashing-mil",
    system="misfire",
    title="Check-engine light is blinking",
    symptom="The malfunction indicator (check engine / service engine soon) flashes while you drive, rather than staying on steadily.",
    means="EPA: a blinking light means a severe engine problem such as a catalyst-damaging misfire is occurring. You can still move the vehicle, but minimize time on the road and avoid high speed, heavy load, and towing until it is diagnosed.",
    keywords=["blinking", "flashing", "check engine", "MIL", "misfire"],
    tier="cited",
    sources=["epa_obd"],
    safety=["A flashing MIL is a catalyst-damaging misfire risk (EPA). Reduce driving, avoid high speed and heavy load, and diagnose as soon as you can. Raw fuel in a converter can overheat it."],
    difficulty="moderate",
    related_dtcs=["P0300", "P0301", "P0302", "P0303", "P0304", "P0420"],
    causes=[
        C("Active misfire on one or more cylinders", "high", [
            scan_codes("Read misfire counts and the cylinder ID. EPA expects a shop to connect a scan tool and download the stored information."),
            T("In-line spark tester or a swap of a coil/plug only as a test, plus a look at the plug",
              "Identify the cylinder the scan tool counts. Inspect that plug and confirm spark or coil operation the manual's way.",
              "The cylinder stops misfiring when the failed coil, plug, or injector is isolated and the count on that cylinder returns to near zero",
              "Misfire continues after a known-good spark path, or several cylinders count at once — look at fuel, compression, or a shared power/ground"),
        ], "Repair the ignition, injector, or mechanical problem the cylinder tests name. Recheck that the light goes back to steady or off after several trips; a damaged catalyst is a separate check (P0420 family)."),
        C("A wiring or connector fault that cuts spark or injection under load", "medium", [
            wiggle_harness("the coil or injector on the misfiring cylinder"),
        ], "Repair the harness or connector. Clear the code only after the repair, and confirm the light no longer flashes on a road test."),
    ],
))

add(dict(
    id="mis-random",
    system="misfire",
    title="Random or multiple-cylinder misfire",
    symptom="The engine shakes, and a scan tool shows P0300 or misfire counts on more than one cylinder. A flashing light may come and go under load.",
    means="A shared problem — lean mixture, fuel delivery, a wet ignition system, a plugged EGR, or a mechanical issue that is not limited to one hole — is more likely than five failed coils at once.",
    keywords=["P0300", "random misfire", "multiple misfire", "shakes"],
    tier="generated-general",
    sources=["epa_obd"],
    safety=[SAFE_FUEL, SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=["P0300", "P0171", "P0174"],
    causes=[
        C("Lean mixture or a vacuum leak that shows on several cylinders", "high", [
            T("Scan tool long- and short-term fuel trims at idle and at a raised rpm",
              "Record trims and whether they shrink when you raise rpm.",
              "Trims stay modest at idle and cruise",
              "Large positive trims, especially at idle — find the unmetered air or the low-fuel-pressure cause"),
        ], "Repair the leak or the fuel-delivery problem. Recheck misfire counts."),
        C("Low fuel pressure or contaminated fuel affecting all injectors", "medium", [
            T("Fuel-pressure gauge and a careful look at a fuel sample if contamination is suspected",
              "Measure running pressure and, if safe, note color or water in a sample taken the manual's way.",
              "Pressure is in the manual's range and the fuel looks clean",
              "Low pressure, or water or debris in the fuel",
              MANUAL),
        ], "Repair the pump or filter, or have the tank cleaned if the fuel is contaminated."),
        C("Wet or cracked coils/wires, or a shared ignition power/ground fault", "medium", [
            T("Eyes and a nighttime or mist test only if it is safe, plus a meter on ignition power and ground",
              "Inspect boots and wires for carbon tracks. Confirm ignition power and ground at a coil connector.",
              "Dry, intact insulation and solid power/ground",
              "A visible track, a punch-through, or a missing shared feed"),
        ], "Replace damaged coils or wires as a set if the manual says they are a wear item together, and repair the shared feed."),
    ],
))

add(dict(
    id="mis-single",
    system="misfire",
    title="Single-cylinder misfire",
    symptom="A steady shake at idle or under load, and the scan tool points at one cylinder (P0301–P0312 family).",
    means="Start with the spark plug, coil, and connector on that cylinder, then the injector, then compression. Swap tests (coil or plug to another hole) are valid only when the manual's connectors allow a clean swap.",
    keywords=["single cylinder", "P0301", "one cylinder", "dead hole"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL, SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=["P0301", "P0302", "P0303", "P0304", "P0201", "P0351"],
    causes=[
        C("Failed or fouled spark plug, or a failed coil, on that cylinder", "high", [
            T("Plug socket and a spark tester or a documented coil/plug swap",
              "Inspect the plug for oil, coolant, a wide gap, or a cracked insulator. Swap the coil to another cylinder if the layout allows, and see whether the misfire moves.",
              "The plug looks serviceable and the misfire stays on the original cylinder when the coil is swapped, or it moves with a failed coil",
              "A fouled or damaged plug, or a misfire that follows the coil"),
        ], "Replace the failed plug or coil with the type the manual lists. Recheck misfire counts."),
        C("Injector on that cylinder not firing or stuck", "medium", [
            T("Scan tool injector contribution or a safe noid-light / current-probe check per the manual",
              "Confirm the module is commanding the injector and that the injector actually clicks or draws current.",
              "Command and current are present and similar to a neighboring cylinder",
              "No command, no current, or a dead-silent injector",
              MANUAL),
        ], "Repair the injector circuit or replace the injector. Relieve fuel pressure first."),
        C("Low compression or a valvetrain problem on that cylinder", "medium", [
            T("Compression or leak-down tester",
              "Measure the misfiring cylinder against a good neighbor, using the manual's method.",
              "Compression is in the manual's range and close to its neighbors",
              "A clearly low cylinder — leak-down to decide rings vs valves vs a head-gasket leak",
              MANUAL),
        ], "Repair the mechanical cause. Do not keep replacing ignition parts on a low-compression hole."),
    ],
))

add(dict(
    id="mis-under-load",
    system="misfire",
    title="Misfire only under load",
    symptom="Idle is acceptable, but the engine stumbles, pops, or flashes a light when you accelerate or climb a grade.",
    means="Load raises cylinder pressure and current demand. A weak coil, a lean fuel problem, or a spark that jumps to ground only under that pressure will show here first.",
    keywords=["misfire under load", "hesitation", "stumble", "acceleration miss"],
    tier="generated-general",
    sources=["epa_obd"],
    safety=[SAFE_FUEL, SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=["P0300", "P0171", "P0087"],
    causes=[
        C("Weak coil or a plug with too wide a gap", "high", [
            T("Scan tool misfire counts on a safe loaded pull, plus a plug inspection",
              "Note which cylinder counts only under load. Inspect the gap and the coil boot for a hidden puncture.",
              "Counts stay near zero under a moderate load and the plug gap is in the manual's range",
              "Counts jump on load, or the boot has a pin-hole burn-through",
              MANUAL),
        ], "Replace the failed coil or the plug, set the gap the manual lists, and retest under the same load."),
        C("Fuel pressure that sags only under load", "medium", [
            T("Fuel-pressure gauge during a safe loaded acceleration",
              "Watch pressure as load rises.",
              "Pressure holds in the loaded range the manual lists",
              "A sag that lines up with the stumble",
              MANUAL),
        ], "Repair the pump, filter, or regulator."),
    ],
))

add(dict(
    id="mis-idle-only",
    system="misfire",
    title="Misfire or rough shake at idle only",
    symptom="The engine shakes in gear at a light or at idle in park, but smooths out when you raise rpm.",
    means="Idle is the least forgiving speed. A vacuum leak, a dirty injector, a sticking EGR, or an ignition issue that is masked at higher rpm will show here.",
    keywords=["rough idle", "shake at idle", "misfire at idle"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=["P0300", "P0506", "P0171"],
    causes=[
        C("Vacuum leak or an uneven idle-air path", "high", [
            T("Scan tool trims at idle vs 2,000 rpm, plus a listen for a hiss",
              "Compare trims and smoothness as you raise rpm in park, safely.",
              "Idle smooths only slightly with rpm, and trims stay modest",
              "A large idle-only trim or a hiss that changes idle when you move a hose"),
        ], "Repair the leak or clean the throttle / idle path as the manual allows."),
        C("One dirty or dripping injector that is obvious only at idle", "medium", [
            T("Scan tool cylinder contribution or a careful temperature comparison at the exhaust ports if the manual has a method",
              "Look for one cylinder that is cooler or that shows a consistent idle misfire count.",
              "Contribution is even",
              "One cylinder is clearly lazy at idle and cleans up off idle"),
        ], "Clean or replace that injector only after the contribution test, using the service-manual procedure."),
    ],
))

add(dict(
    id="mis-when-wet",
    system="misfire",
    title="Misfire in rain or after a wash",
    symptom="The engine runs well when dry, then stumbles, cuts, or sets a misfire after rain, a deep puddle, or an engine wash.",
    means="Water on cracked boots, open coil wells, or a leaking connector lets spark jump to ground. The repair is to find the wet path, not to replace every coil blindly.",
    keywords=["wet", "rain", "misfire after wash", "moisture"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_RUNNING, "Keep water out of the intake. Do not spray a running engine."],
    difficulty="easy",
    related_dtcs=["P0300"],
    causes=[
        C("Cracked coil boot or a coil well full of water", "high", [
            T("Eyes and a dry towel, engine off",
              "Lift the coil or boot (battery may need to be disconnected if the manual says so) and look for standing water, a white or carbon track, or a crack.",
              "Dry wells, intact boots, no carbon track",
              "Water in the well or a clearly tracked boot"),
        ], "Dry the well, replace the damaged boot or coil, and seal only if the manual calls for a specific grease or cover."),
        C("A connector or ground that only fails when wet", "medium", [
            wiggle_harness("the wet ignition or sensor connector"),
        ], "Dry, clean, and repair the connector. Replace a damaged seal."),
    ],
))

add(dict(
    id="mis-ping-octane",
    system="misfire",
    title="Ping or spark knock under load",
    symptom="A high-pitched metallic tapping on acceleration or on a grade, related to engine speed. FTC: this is usually lower-octane fuel than the owner's manual calls for; if it persists, ignition timing could be at fault.",
    keywords=["ping", "spark knock", "detonation", "octane", "tapping"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING, "Persistent knock can damage pistons. Ease off the load and diagnose; do not keep climbing a grade under heavy knock."],
    difficulty="easy",
    related_dtcs=["P0325", "P0327", "P2336"],
    causes=[
        C("Fuel octane lower than the owner's manual requires", "high", [
            T("The filler cap / owner's manual, and a known-good tank of the specified grade",
              "Confirm the required octane and what was last added. Try one tank of the specified grade.",
              "The knock goes away on the correct grade",
              "Knock continues on the correct grade — move to timing, carbon, or a failed knock sensor"),
        ], "Use the octane the owner's manual lists. Do not assume a higher grade will fix a mechanical timing problem."),
        C("Ignition timing, heavy carbon, or a failed knock sensor", "medium", [
            scan_codes("Look for knock-sensor codes and for a timing or cam/crank correlation error."),
            T("Scan tool spark-advance PID during a gentle loaded pull, compared with the manual's expected behavior",
              "Watch whether the module is able to retard on knock.",
              "Advance behaves as the manual describes and knock is controlled",
              "No knock-sensor activity, or a stuck aggressive advance, with knock still audible",
              MANUAL),
        ], "Repair the sensor, the timing component, or the carbon condition the tests name. Timing adjustments are per the service manual only."),
    ],
))

add(dict(
    id="mis-heavy-knock",
    system="misfire",
    title="Heavy rhythmic knock from the engine",
    symptom="A low, rhythmic pounding that is related to engine speed, not a light tick. FTC lists a heavy knock as worn crankshaft or connecting-rod bearings, or a loose transmission torque converter.",
    keywords=["rod knock", "heavy knock", "bearing", "pounding"],
    tier="cited",
    sources=["ftc_basics"],
    safety=["A true rod or main-bearing knock can end the engine quickly. Avoid high rpm. Check oil pressure before a long drive. This is not a 'thicker oil' fix."],
    difficulty="advanced",
    related_dtcs=["P0521", "P0522"],
    causes=[
        C("Low oil pressure letting a bearing knock", "high", [
            T("Mechanical oil-pressure gauge at the service-manual port, not only the dash lamp",
              "Measure pressure at idle and at the rpm the manual lists, with the correct oil grade and a known level.",
              "Pressure is in the manual's range at both speeds",
              "Pressure is below the manual at idle or higher rpm — find why (pump, pickup, dilution, or worn bearings) before a long trip",
              MANUAL),
        ], "Do not keep running a low-pressure engine. Repair the pump, pickup, or the bearing damage the inspection finds."),
        C("Worn rod or main bearing (true rod knock)", "medium", [
            T("A careful listen with a stethoscope, and an oil-level and oil-condition check (fuel or coolant dilution)",
              "Note whether the knock is under the oil pan, is louder under load, and quiets slightly with a short rpm rise (classic rod-knock pattern) versus a tick at the valve cover.",
              "The sound is clearly a top-end tick, or it is not load-related — do not call it rod knock yet",
              "A deep, load-related pound at the crankcase, especially with low pressure or glitter in the oil"),
        ], "This is an engine-out or at least a lower-end inspection. See the rebuild path in this app if the measurements confirm it."),
        C("Loose torque-converter bolts (FTC also lists this under heavy knock)", "medium", [
            T("Inspection of converter-to-flexplate bolts, vehicle safely supported, as the manual shows",
              "Check torque of the converter bolts and look for elongated holes or a cracked flexplate.",
              "Bolts are tight and the plate is intact",
              "Loose bolts or a cracked plate — repair before the engine or transmission takes more damage",
              MANUAL),
        ], "Replace damaged bolts or a cracked flexplate and torque to the manual. Recheck for the knock."),
    ],
))

# ---------------------------------------------------------------------------
# Cooling
# ---------------------------------------------------------------------------
add(dict(
    id="cool-overheat-steam",
    system="cooling",
    title="Overheating with steam or a sweet, hot, metallic smell",
    symptom="Temperature gauge or lamp shows hot, and you see steam or smell a sweet, steamy odor with a hot metallic scent from under the hood. FTC: pull over immediately; continued driving can cause severe engine damage; the vehicle should be towed.",
    keywords=["overheat", "steam", "sweet smell", "boil over"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_COOL, "If the gauge is hot and you see steam, stop driving. Tow the vehicle. Do not open the cap."],
    difficulty="moderate",
    related_dtcs=["P0128", "P0217"],
    causes=[
        C("Coolant loss from a hose, radiator, or water-pump leak (FTC lists these as causes of an antifreeze leak)", "high", [
            visual_leak("at the radiator, hoses, water-pump weep hole, and under the front of the vehicle — only after the engine is fully cool"),
            fluid_level("Coolant", "When completely cool, check the reservoir and, if the manual says it is safe, the radiator level."),
        ], "Repair the leaking hose, radiator, or pump. Refill and bleed the system the manual's way. Do not drive until the level holds."),
        C("Thermostat stuck closed, a failed fan, or a plugged radiator", "medium", [
            T("Infrared thermometer or careful hand comparison (only on a cool-enough surface), plus a look at fan operation after a controlled idle once the system is safe to run",
              "After a proper refill, watch whether the upper hose stays cold too long (stuck closed) or the electric fan never comes on, or the radiator inlet is hot while the outlet stays cold.",
              "The thermostat opens in the range the manual lists, the fan commands on, and both tanks of the radiator get hot",
              "The engine goes hot with a cold radiator, or the fan never runs — test that part next",
              MANUAL),
        ], "Replace the thermostat or repair the fan circuit. A plugged radiator is a clean-or-replace job; flush only with a method the manual allows."),
    ],
))

add(dict(
    id="cool-overheat-no-steam",
    system="cooling",
    title="Overheats on the gauge with no visible steam",
    symptom="The temperature gauge climbs or a warning lamp comes on, but you do not see a puddle or a steam cloud.",
    means="The system may be low (the leak is slow or internal), the thermostat or fan may be at fault, the gauge or sender may be lying, or the radiator is not transferring heat. Confirm a real overheat before tearing parts out.",
    keywords=["overheat", "gauge high", "no leak", "temperature"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_COOL],
    difficulty="moderate",
    related_dtcs=["P0128", "P0117", "P0118"],
    causes=[
        C("Low coolant from a slow or internal leak", "high", [
            fluid_level("Coolant", "When completely cool, check the reservoir and radiator (if the manual allows). Look for a falling level over several days."),
            T("Eyes on the oil cap and dipstick, and the exhaust for a sweet white steam that is not just cold-start vapor",
              "Look for a milky film or a persistent sweet white exhaust after warm-up (see smoke-color entries).",
              "Level holds, oil is not milky, and there is no persistent white exhaust",
              "Level keeps falling with no external drip, or the oil is milky — consider a head-gasket or cracked-head path"),
        ], "Find the leak (pressure-test the cold system per the manual) before just adding water."),
        C("Failed thermostat, fan, or a weak water pump", "high", [
            T("Scan tool ECT vs a careful observation of hose temperatures and fan command, only after the system has a proper fill",
              "Watch whether ECT rises past the manual's opening point with no fan and no temperature change at the radiator.",
              "Thermostat, pump, and fan all do what the manual describes at temperature",
              "ECT soars while the radiator stays cool, the fan never runs, or the pump pulley is loose / the pump is silent of flow",
              MANUAL),
        ], "Replace the failed thermostat, fan part, or pump using the gasket and bleed procedure in the manual."),
        C("A lying gauge or coolant-temperature sender", "medium", [
            T("Scan tool ECT compared with an infrared reading on the thermostat housing, plus a cluster self-test if the vehicle has one",
              "Compare reported temperature with a measured housing temperature.",
              "The gauge, the PID, and the measured temperature agree",
              "The gauge is pegged while the PID and the housing are normal — diagnose the cluster or the gauge circuit"),
        ], "Repair the sender or cluster circuit. Do not replace a radiator for a lying gauge."),
    ],
))

add(dict(
    id="cool-overheat-idle-only",
    system="cooling",
    title="Overheats in traffic, cools on the highway",
    symptom="The gauge climbs in stop-and-go traffic or at a long idle, then comes back down once you are moving at speed.",
    means="At idle the radiator gets little ram air, so the fan and a clean radiator face do the work. A failed fan, a shroud problem, or a clogged core shows up here first.",
    keywords=["overheat in traffic", "idle overheat", "fan"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_COOL, SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=["P0480"],
    causes=[
        C("Electric fan not running, or a failed fan clutch on an engine-driven fan", "high", [
            T("Eyes on the fan at a safe hot idle, plus a fuse/relay/command check for an electric fan",
              "With the engine at the temperature where the fan should run, confirm it actually spins. For a clutch fan, a light push-stop (engine off, cold or only mildly warm, following the manual) and a look at whether it slips when hot.",
              "The electric fan commands on and spins, or the clutch fan pulls hard air when the engine is hot",
              "The electric fan never spins, or the clutch fan freewheels when hot",
              MANUAL),
        ], "Repair the fuse, relay, sensor, wiring, fan motor, or fan clutch the test names."),
        C("Clogged radiator face, missing shroud, or debris in the condenser pack", "medium", [
            T("Flashlight through the grille, engine cool",
              "Look for bugs, leaves, mud, or a bent fin pack, and confirm the shroud is present.",
              "Air can pass through the core, and the shroud is intact",
              "A packed core or a missing shroud"),
        ], "Clean the core carefully (straight water, low pressure, from the engine side as the manual allows). Reinstall the shroud."),
    ],
))

add(dict(
    id="cool-overheat-highway",
    system="cooling",
    title="Overheats at highway speed, may be calmer in town",
    symptom="The gauge is acceptable around town, then climbs at speed, on a long grade, or when towing.",
    means="High speed and high load raise heat rejection. A weak radiator, a collapsing lower hose, a failing water pump, a stuck-closed thermostat, or a low fill that only uncovers the system under load will show here.",
    keywords=["highway overheat", "overheat at speed", "towing overheat"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_COOL],
    difficulty="moderate",
    related_dtcs=["P0128"],
    causes=[
        C("Collapsing lower radiator hose or a weak cap", "high", [
            T("Eyes on the lower hose during a safe load, and a cap test with a cooling-system pressure tester",
              "Watch whether the lower hose flattens at speed (or on a hoist at rpm, if the manual has a procedure). Test the cap at the manual's rated pressure.",
              "The hose stays round and the cap holds the rated pressure",
              "The hose collapses, or the cap will not hold",
              MANUAL),
        ], "Replace a collapsing hose (often the spring inside is missing) or a cap of the correct rating."),
        C("Radiator that cannot reject enough heat, or a slipping pump impeller", "medium", [
            T("Infrared comparison of radiator inlet vs outlet at a hot, loaded idle or as the manual suggests",
              "A good radiator usually shows a clear temperature drop from inlet to outlet when the thermostat is open; a pump that is spinning but not moving coolant leaves both sides similarly not flowing.",
              "A clear inlet-to-outlet drop once the thermostat is open, and the heater also gets hot",
              "Almost no drop, or a heater that stays cold while the gauge climbs — suspect a plugged radiator or a pump impeller"),
        ], "Replace the radiator or the pump as the temperature pattern indicates, and bleed the system."),
    ],
))

add(dict(
    id="cool-heater-cold-engine-hot",
    system="cooling",
    title="Heater blows cold while the engine is overheating or running hot",
    symptom="The cabin heater stays cold even though the engine is up to temperature — sometimes while the gauge is actually high.",
    means="A low coolant level often uncovers the heater core first. Air in the system, a stuck thermostat (open or closed, depending on layout), or a plugged heater core can do the same.",
    keywords=["no heat", "heater cold", "overheat no heat"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_COOL],
    difficulty="moderate",
    related_dtcs=["P0128"],
    causes=[
        C("Low coolant or air in the system", "high", [
            fluid_level("Coolant", "When completely cool, check the reservoir and radiator. Note whether the level drops after a short drive and burps back into the bottle."),
        ], "Fill and bleed using the manual's bleed screws or procedure. Find why it was low."),
        C("Stuck thermostat or a plugged heater core", "medium", [
            T("Careful comparison of both heater hoses once the engine is warm (not scalding — use an infrared thermometer if you have one)",
              "Both heater hoses should be hot when the heater is commanded hot and the engine is warm.",
              "Both hoses are hot and the vent then blows heat",
              "One hose hot and one cold, or both cold with a hot engine — thermostat or a plugged core"),
        ], "Replace the thermostat or flush/replace the heater core as the hose test indicates."),
    ],
))

add(dict(
    id="cool-gauge-stays-cold",
    system="cooling",
    title="Temperature gauge stays cold, or the engine never reaches temperature",
    symptom="The gauge sits at or near the bottom after a long drive, the heater is weak, or fuel economy and idle are poor in a way that suggests the engine is over-cooled.",
    means="A thermostat stuck open is the usual mechanical cause. A lying sender or gauge can also stay low. FTC does not give a numeric opening temperature — use the service manual.",
    keywords=["stays cold", "thermostat open", "won't warm up"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_COOL],
    difficulty="moderate",
    related_dtcs=["P0128"],
    causes=[
        C("Thermostat stuck open", "high", [
            T("Scan tool ECT during a warm-up, and a hand or infrared check of the upper radiator hose (carefully)",
              "A stuck-open thermostat lets the upper hose get warm early, and ECT may stall below the manual's regulated temperature.",
              "ECT climbs to the regulated range the manual lists and holds there",
              "ECT hangs low and the upper hose is warm almost immediately",
              MANUAL),
        ], "Replace the thermostat with the correct opening temperature and bleed the system."),
        C("Failed coolant-temperature sender or a cluster gauge fault", "medium", [
            T("Scan tool ECT versus the dash gauge and an infrared housing reading",
              "Compare the three.",
              "All three agree that the engine is warm",
              "The PID is warm and the gauge stays cold, or the PID stays impossibly low"),
        ], "Repair the sender or the cluster circuit."),
    ],
))

add(dict(
    id="cool-loss-no-external-leak",
    system="cooling",
    title="Coolant level keeps falling with no puddle under the vehicle",
    symptom="You keep adding coolant, the underbody is dry, and there is no obvious wet hose.",
    means="The leak may be internal (head gasket, cracked head or block), evaporating from a residual tank, going out the overflow only when hot, or hiding on the passenger-side heater box (wet carpet, sweet smell).",
    keywords=["coolant loss", "no leak", "adds coolant", "head gasket"],
    tier="generated-general",
    sources=["ftc_basics", "oregon_smoke"],
    safety=[SAFE_COOL, SAFE_EXHAUST],
    difficulty="advanced",
    related_dtcs=["P0301", "P0171"],
    causes=[
        C("Heater-core leak into the cabin", "high", [
            T("Eyes and nose on the passenger carpet and under the dash",
              "Look for a wet carpet, fogged glass with a sweet smell, or coolant at the heater drain.",
              "Carpet is dry and there is no sweet smell in the vents",
              "A wet passenger floor or a sweet smell when the heater is on"),
        ], "Repair or replace the heater core. This is often a dashboard-out job — follow the manual."),
        C("Head-gasket or cracked-head leak into a cylinder or the crankcase", "high", [
            T("Oil-cap and dipstick inspection, plus a look at the exhaust after warm-up, and a chemical block test or an exhaust-in-coolant test if you have the tool",
              "Look for milky oil, persistent white exhaust after warm-up, or bubbles in a cold-filled radiator during cranking (only with the cap off on a cold engine, as the manual allows).",
              "Oil is clean, exhaust is not a persistent sweet white, and a block test is negative",
              "Milky oil, a positive block test, or persistent white exhaust — cooling-system pressure and a leak-down are next"),
        ], "A confirmed internal leak is a head-gasket or head/block repair. Do not keep topping up and driving if the oil is milky."),
        C("Overflow only when hot (cap or a boiling system)", "medium", [
            T("Cooling-system cap tester and a look at the overflow after a hot shutdown, once cool enough to be safe",
              "Test the cap. Note whether the bottle is pushed over only after a hot run.",
              "The cap holds the rated pressure and the bottle level is stable once the system is sound",
              "The cap fails, or the system boils at a temperature the manual says it should not",
              MANUAL),
        ], "Replace the cap with the correct rating and then find why it is over-pressuring if a new cap still overflows."),
    ],
))

add(dict(
    id="cool-milky-oil",
    system="cooling",
    title="Milky oil, or oil in the coolant",
    symptom="The oil looks like a chocolate milkshake, or the coolant tank has a brown oily film.",
    means="Coolant and oil are mixing. On many engines that is a head gasket, a cracked head or block, or an oil-to-coolant cooler failure. Do not keep driving — coolant in the oil wrecks bearings.",
    keywords=["milky oil", "mayonnaise", "oil in coolant", "head gasket"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_COOL, "Do not run the engine any longer than needed to move it somewhere safe. Coolant-thinned oil can destroy the bearings."],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Failed engine-oil cooler or oil-cooler lines (if equipped)", "high", [
            T("Inspection of the oil cooler and a cooler isolation or pressure test if the manual has one",
              "Look at a water-to-oil cooler (often in the radiator tank or a remote sandwich) for a cross-leak.",
              "The cooler holds on a pressure test and the mix stops after a cooler replacement in cases where the head-gasket test is negative",
              "The cooler fails a pressure test, or oil keeps appearing in the coolant with a negative combustion-leak test"),
        ], "Replace the cooler and flush both systems as the manual directs. Change the oil and filter after the mix is stopped."),
        C("Head gasket, cracked head, or cracked block", "high", [
            T("Chemical block tester or the manual's equivalent, plus a compression or leak-down test",
              "Test for combustion gas in the coolant and measure cylinder sealing.",
              "No combustion in the coolant and compression is even — look harder at the cooler",
              "A positive combustion leak or a cylinder that will not seal",
              MANUAL),
        ], "This is a professional head job. Do not seal it with a stop-leak additive as a diagnosis."),
    ],
))

add(dict(
    id="cool-fan-inop",
    system="cooling",
    title="Electric cooling fan never runs",
    symptom="The fan in front of the radiator does not spin when the engine is hot or when A/C is requested.",
    means="The fan is fused, relayed, and often commanded by the engine module from a coolant or A/C request. Prove power, ground, and command before buying a fan.",
    keywords=["fan not running", "electric fan", "overheat idle"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_COOL, SAFE_RUNNING, "The fan can start without warning. Keep hands clear. Disconnect the fan connector before close inspection."],
    difficulty="moderate",
    related_dtcs=["P0480"],
    causes=[
        C("Blown fuse, failed relay, or a command the module never sends", "high", [
            T("Scan tool fan command, a fused jumper only if the manual allows a direct fan test, plus a meter at the fan connector",
              "See whether the module commands the fan when ECT is high or A/C is on. Check the fuse and whether the relay output goes hot.",
              "Command is present and the relay output is hot when it should be",
              "No command, a dead fuse that may point to a shorted motor, or a relay that never closes",
              MANUAL),
        ], "Replace the fuse or relay, or diagnose the module input, after you know why a fuse blew."),
        C("Failed fan motor or a bad ground at the fan", "medium", [
            multimeter_power("the fan motor connector"),
        ], "Replace the fan motor or repair the ground. Confirm it spins on a hot idle and with A/C if applicable."),
    ],
))

add(dict(
    id="cool-hose-radiator-leak",
    system="cooling",
    title="Visible coolant leak — yellowish green, pastel blue, or fluorescent orange puddle",
    symptom="A colored watery puddle under the front of the vehicle, or a crusted trail on a hose or the radiator. FTC: those colors indicate an antifreeze leak from a bad hose, water pump, or leaking radiator, and can go with an overheated engine.",
    keywords=["coolant leak", "green puddle", "orange coolant", "radiator", "hose"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_COOL, "Antifreeze is toxic to pets. Clean the puddle. Do not drive a rapidly leaking system."],
    difficulty="moderate",
    related_dtcs=[],
    related_jobs=[],
    causes=[
        C("Radiator, hose, clamp, or water-pump weep leak", "high", [
            visual_leak("at every hose end, the radiator tanks and petcock, the water-pump weep, and the thermostat housing — engine cold"),
            T("Cooling-system pressure tester on a cold system, at the cap rating the manual lists",
              "Pressurize only to the rated pressure and watch for a wet spot.",
              "The system holds the rated pressure with no new wetness",
              "A drip appears under pressure, or the gauge falls quickly",
              MANUAL),
        ], "Replace the failed hose, clamp, radiator, pump, or housing. Fill with the coolant type the manual lists and bleed the system."),
    ],
))

add(dict(
    id="cool-water-pump",
    system="cooling",
    title="Water-pump leak or a pump-related squeal / wobble",
    symptom="Coolant weeps from the pump area, the pulley rocks, or a squeal comes from the pump or its bearing.",
    means="Most pumps have a weep hole that shows a failed seal. A failed bearing can shred a belt and leave you without a water pump or an alternator mid-trip.",
    keywords=["water pump", "weep hole", "pump bearing", "coolant leak at pump"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_COOL, SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Failed pump seal (wet weep hole) or a failed bearing", "high", [
            T("Flashlight at the pump body and a careful check for pulley play, engine off and cool",
              "Look for dried coolant tracks from the weep hole and feel for roughness or play at the pulley (do not confuse it with a belt tensioner).",
              "The pump is dry and the pulley is tight, with no grind",
              "A wet weep, a crusted trail, or a pulley that rocks"),
        ], "Replace the water pump, gasket or O-ring, and usually the belt, using the torque and sealant rules in the manual. Bleed the system."),
    ],
))

add(dict(
    id="cool-after-overheat-check",
    system="cooling",
    title="What to check after an overheat before you drive again",
    symptom="The engine already overheated. You want to know whether it is safe to refill and go, or whether the engine was damaged.",
    means="An overheat can warp a head or blow a gasket even if the leak is now 'fixed.' Check oil condition, exhaust color, and for a stable temperature after a careful refill — and do not open a hot cap.",
    keywords=["after overheat", "warped head", "safe to drive"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_COOL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("The system is still low, or a damaged gasket after the overheat", "high", [
            fluid_level("Coolant", "Only when fully cool. Fill and bleed the manual's way."),
            T("Oil cap, dipstick, and a short, instrumented test drive after a proper fill",
              "Look for milky oil. After a refill, watch the gauge closely in a safe place. Stop immediately if it climbs again or if white exhaust appears after warm-up.",
              "Oil is clean, the gauge holds a normal temperature, and there is no persistent white exhaust",
              "Milky oil, a returning overheat, or persistent white exhaust — do not keep driving"),
        ], "If the temperature is stable and the oil is clean, you can then repair the original leak. If not, treat it as a possible head-gasket job."),
    ],
))

print("after cooling", len(ENTRIES))

# ---------------------------------------------------------------------------
# Fuel
# ---------------------------------------------------------------------------
add(dict(
    id="fuel-smell-running",
    system="fuel",
    title="Persistent gasoline smell while the vehicle sits or runs",
    symptom="A raw-fuel odor continues after a start, or you smell gasoline around the tank, filler, or under-hood with no recent failed start. FTC: a persistent gasoline odor is a potentially dangerous fuel-system leak and needs immediate attention.",
    keywords=["fuel smell", "gasoline odor", "evap", "leak"],
    tier="cited",
    sources=["ftc_basics", "epa_obd"],
    safety=[SAFE_FUEL, "Do not start, jump, or smoke around a suspected liquid fuel leak. Park outside, away from igniters."],
    difficulty="moderate",
    related_dtcs=["P0442", "P0455", "P0440"],
    causes=[
        C("Liquid fuel leak at a line, rail, filter, or tank", "high", [
            visual_leak("along the rail, filter, flexible lines, and the top and seams of the tank"),
        ], "Repair the leaking part. Do not drive until the wet leak is fixed."),
        C("Evaporative-emissions leak (loose or missing gas cap, cracked EVAP hose, or a failed purge/vent)", "high", [
            T("Eyes on the gas cap and a scan tool for EVAP codes; after tightening a cap, EPA says the light may go out after a few short trips if that was the cause",
              "Confirm the cap clicks and seals. Read EVAP codes and, if you have a smoke machine, smoke the EVAP system the manual's way — never with open flame.",
              "The cap seals, there is no EVAP code, and a smoke test (if done) shows no leak",
              "A missing or damaged cap, a P0442/P0455 family code, or visible smoke at a hose or canister"),
        ], "Replace a failed cap first (it is the simple item). Then repair the hose, canister, or valve the smoke test names."),
    ],
))

add(dict(
    id="fuel-no-pressure",
    system="fuel",
    title="No fuel pressure — pump silent or pressure at zero",
    symptom="The engine cranks but does not start, you hear no pump prime, or a gauge on the test port stays at zero.",
    means="The pump needs a live feed, a ground, a command (relay or module), often an inertia or shut-off switch, and an unobstructed pickup. Prove those before replacing a pump.",
    keywords=["no fuel pressure", "fuel pump", "no prime"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL, SAFE_BATT],
    difficulty="moderate",
    related_dtcs=["P0230", "P0087", "P0191"],
    causes=[
        C("Dead fuse, relay, inertia switch, or a tank empty / a tripped shut-off after a bump", "high", [
            T("Scan tool pump command, a meter at the pump connector or inertia switch, and a look at the fuel gauge and inertia/reset button",
              "Confirm there is fuel in the tank. Check the inertia or shut-off switch if equipped. See whether the relay output goes live during a prime.",
              "The tank has fuel, the shut-off is reset, and the pump connector has power and ground during prime",
              "An empty tank, a tripped inertia switch, a dead fuse, or no power at the pump",
              MANUAL),
        ], "Reset or replace the shut-off, repair the fuse/relay circuit, or add fuel. Recheck prime."),
        C("Failed pump or a clogged sock / filter", "medium", [
            T("Fuel-pressure gauge and a current-probe or the manual's pump test, with power already proven at the pump",
              "If power and ground are present during prime and pressure stays at zero, the pump or a complete blockage is next.",
              "Pressure rises into the manual's range",
              "Power is present and pressure stays at zero, or current is far outside the manual's pump-current range",
              MANUAL),
        ], "Replace the pump or the clogged filter/sock. Relieve pressure and follow tank-safety procedures."),
    ],
))

add(dict(
    id="fuel-pump-noise",
    system="fuel",
    title="Loud fuel-pump whine from the tank",
    symptom="A noticeable electric whine from under the rear seat or the tank, sometimes worse at idle or when the tank is low.",
    means="Pumps get louder as they wear, when they run dry, or when a strainer is starved. A sudden new howl plus a stumble is more urgent than a modest prime sound.",
    keywords=["fuel pump noisy", "whine from tank", "pump noise"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=["P0087"],
    causes=[
        C("Low fuel letting the pump suck air, or a failing pump", "high", [
            T("Fuel gauge plus a pressure gauge at idle and under a short load",
              "Note whether the noise and a pressure sag appear only at a low tank level.",
              "Pressure stays in the manual's range at a known-good fuel level, and the noise is no more than this model's usual prime",
              "Pressure sags or the pump howls even with a reasonably full tank",
              MANUAL),
        ], "Start by adding fuel. If the noise and sag remain with a proper level, replace the pump and inspect the sock."),
    ],
))

add(dict(
    id="fuel-dies-low-tank",
    system="fuel",
    title="Runs badly or dies when the tank is low",
    symptom="The engine is fine on a full tank and stumbles, loses power, or dies when the gauge is low — sometimes after a turn or a grade.",
    means="A cracked pickup sock, a failing pump that needs submersion for cooling, or rust/debris at the bottom of the tank will show up first at a low level.",
    keywords=["dies when low", "low fuel stall", "pickup sock"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=["P0087"],
    causes=[
        C("Pickup sock, tank debris, or a pump that cannot pick up at a low level", "high", [
            T("A road test with a known fuel quantity, then a pressure gauge when the symptom appears",
              "Reproduce only in a safe place. Watch pressure as you turn or climb with a low tank.",
              "Pressure holds even at the level that used to stall the engine",
              "Pressure collapses on a turn or at a low indicated level"),
        ], "Inspect the tank, sock, and pump. Clean or replace as found. Do not keep running a pump dry."),
    ],
))

add(dict(
    id="fuel-contaminated",
    system="fuel",
    title="Bad tank of fuel, or water in the fuel",
    symptom="After a fill-up, the engine suddenly runs rough, misfires, or will not start. A diesel may be worse. A water-separating filter may show a clear layer.",
    means="Water or the wrong fuel (gasoline in a diesel, a heavy load of stale gas) will affect every cylinder at once, right after a fill.",
    keywords=["bad gas", "water in fuel", "wrong fuel", "contaminated"],
    tier="generated-general",
    sources=["fueleconomy"],
    safety=[SAFE_FUEL, "Draining a tank is a fire hazard. Use a proper container and a ventilated area."],
    difficulty="moderate",
    related_dtcs=["P0300"],
    causes=[
        C("Water or the wrong fuel in the tank", "high", [
            T("A fuel-sample procedure the manual or a shop allows, plus a look at a diesel water separator",
              "Note the timing (right after a fill). Inspect a sample for a water layer or an odd color/smell.",
              "The fuel looks and smells like the correct fuel, and there is no water layer",
              "A water layer, gasoline in a diesel, or diesel in a gasoline engine"),
        ], "Do not keep cranking. Have the tank drained and flushed, and replace the fuel filter. Repair any damaged injectors or pumps the contamination caused."),
    ],
))

add(dict(
    id="fuel-lean",
    system="fuel",
    title="Lean condition (high positive fuel trims, or a lean code)",
    symptom="A lean code (P0171/P0174 family), a surge, a stall at idle, or a misfire, with short- or long-term trims well positive.",
    means="The module is adding fuel because it thinks the mixture is lean. Unmetered air, a low-fuel-pressure problem, or a biased airflow or oxygen sensor can all look lean.",
    keywords=["lean", "P0171", "P0174", "fuel trim"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=["P0171", "P0174", "P0101"],
    causes=[
        C("Vacuum leak or unmetered air after the airflow sensor", "high", [
            T("Scan tool trims at idle vs a raised rpm, plus a careful smoke or listen test",
              "Large positive trims that shrink off idle usually mean unmetered air.",
              "Trims stay modest at idle and cruise",
              "Very positive trims at idle that improve at 2,000 rpm"),
        ], "Repair the hose, gasket, PCV, or brake-booster leak. Do not use open flame."),
        C("Low fuel pressure or a restricted filter", "medium", [
            T("Fuel-pressure gauge at idle and under load",
              "Compare with the service-manual specification.",
              "Pressure is in range at idle and load",
              "Pressure is low in both conditions, or only under load",
              MANUAL),
        ], "Replace the filter or repair the pump/regulator."),
        C("Biased MAF or oxygen sensor", "medium", [
            T("Scan tool MAF grams/sec versus a reasonable expected value, and a look at O2 or AF-sensor activity, plus a careful cleaning only if the manual allows it",
              "A MAF that reads far too low for the rpm, or a lazy/s saturated O2 sensor, will drive a lean trim.",
              "MAF and O2 activity look plausible and respond to a snap throttle",
              "A stuck sensor or a MAF that is clearly out of a reasonable range — confirm with the manual's values",
              MANUAL),
        ], "Clean or replace the sensor the data names, using the part specified for this engine."),
    ],
))

add(dict(
    id="fuel-rich",
    system="fuel",
    title="Rich condition (black smoke, sooty plugs, or a rich code)",
    symptom="Black or gray exhaust, a fuel smell, poor economy, sooty plugs, or a rich code (P0172/P0175 family).",
    means="The module is seeing a rich mixture, or fuel is entering the engine without being measured. Leaking injectors, high pressure, a stuck-open purge, or a biased sensor are typical.",
    keywords=["rich", "P0172", "black smoke", "sooty"],
    tier="generated-general",
    sources=["oregon_smoke"],
    safety=[SAFE_FUEL, SAFE_EXHAUST],
    difficulty="moderate",
    related_dtcs=["P0172", "P0175"],
    causes=[
        C("Leaking injector or fuel pressure too high", "high", [
            T("Fuel-pressure gauge, including a residual-pressure hold, and a look at plugs or a contribution test",
              "Check running pressure and whether pressure bleeds down quickly at shutdown (a leak-down).",
              "Pressure is in the manual's range and holds at shutdown",
              "Pressure is high, or it collapses as an injector dribbles into a cylinder",
              MANUAL),
        ], "Repair the regulator or the dripping injector. A soaked catalyst is a separate risk."),
        C("Stuck-open evap purge or a leaking fuel-pressure regulator (vacuum-referenced)", "medium", [
            T("Scan tool purge command and a clamp or the manual's functional test of the purge valve; inspect a vacuum-referenced regulator for fuel in the vacuum hose",
              "A purge valve that is open at idle, or a vacuum line that smells like fuel, will richen the idle.",
              "Purge is closed at idle and the regulator vacuum hose is dry",
              "Purge flows at idle, or the vacuum hose is wet with fuel"),
        ], "Replace the purge valve or the regulator. Recheck trims."),
    ],
))

add(dict(
    id="fuel-filter-restriction",
    system="fuel",
    title="Restricted fuel filter or a clogged line",
    symptom="Good starts and idle, then a mid-range flat spot or a stall under load that may improve as demand drops. Pressure at idle may still look acceptable.",
    means="A restriction shows up as a pressure drop or a large gap between a test-port reading and what the rail actually has under load. Some vehicles have no serviceable inline filter — the manual will say.",
    keywords=["fuel filter", "restriction", "sags under load"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=["P0087"],
    causes=[
        C("Clogged serviceable filter, or a kinked/rusty line", "high", [
            T("Fuel-pressure gauge at idle and under a safe load, and eyes on the line and filter",
              "Note a healthy idle pressure that collapses under load, and inspect the filter and lines.",
              "Pressure holds under load and the lines are open",
              "A loaded sag with a visibly crushed or overdue filter",
              MANUAL),
        ], "Replace the filter if the vehicle has one, or repair the line. Use the correct direction of flow."),
    ],
))

add(dict(
    id="fuel-injector-dead",
    system="fuel",
    title="One injector not contributing",
    symptom="A single-cylinder misfire that does not follow a swapped coil, and the injector on that hole is quiet or has no current.",
    means="The module, the wiring, or the injector itself can be dead. Prove command and current before dropping the rail.",
    keywords=["dead injector", "injector circuit", "P0201"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=["P0201", "P0202", "P0301"],
    causes=[
        C("Open connector, wiring, or a failed injector winding", "high", [
            connector_tug("the suspect injector"),
            T("Noid light or a current probe, and a resistance check only at the specification in the service manual",
              "Confirm a pulse at the connector and compare current or resistance with a neighboring injector — use the manual's ohms, not a guessed number.",
              "A clean pulse and a resistance in the manual's range",
              "No pulse (wiring or module) or a winding well outside the manual's range",
              MANUAL),
        ], "Repair the wiring or replace the injector. Relieve pressure and use new seals."),
    ],
))

add(dict(
    id="fuel-diesel-hard-start",
    system="fuel",
    title="Diesel hard start, especially when cold",
    symptom="A diesel cranks normally or slowly, takes a long time to fire when cold, and may show white start-up smoke. Glow-plug or fuel-delivery problems are first suspects.",
    means="Cold diesels rely on glow plugs or intake heat, plus enough injection pressure. White smoke on a long cold start can be unburned fuel — see also the diesel smoke entries.",
    keywords=["diesel", "glow plug", "hard start diesel", "white smoke start"],
    tier="generated-general",
    sources=["oregon_smoke"],
    safety=[SAFE_FUEL, "High-pressure diesel injection can pierce skin. Do not crack high-pressure lines to 'see if it sprays.'"],
    difficulty="moderate",
    related_dtcs=["P0380", "P0200"],
    causes=[
        C("Glow plugs or the glow-plug controller not heating", "high", [
            T("Scan tool glow command and a current or resistance check of each plug per the service manual",
              "During a cold start, confirm the controller commands heat and that each plug draws in the manual's range. Do not invent an ohm number.",
              "Command is present and each plug measures in the manual's range",
              "A dead controller, a blown glow fuse, or one or more plugs open",
              MANUAL),
        ], "Replace failed plugs or the controller. Use the specified plugs and torque."),
        C("Low injection pressure, air in the fuel, or a failing lift pump", "medium", [
            T("The manual's fuel-pressure or air-bleed procedure, plus a look at the water separator",
              "Bleed air as instructed. Check a low-pressure (lift) pump if equipped, and drain water from the separator.",
              "The system primes, there is no air, and pressure is in the manual's range",
              "Air keeps returning, or lift pressure is low",
              MANUAL),
        ], "Repair the leak that lets air in, replace a failed lift pump or filter, and drain water."),
    ],
))

# ---------------------------------------------------------------------------
# Ignition (automotive)
# ---------------------------------------------------------------------------
add(dict(
    id="ign-no-spark",
    system="ignition",
    title="No spark on a cranking gasoline engine",
    symptom="The engine cranks, a spark tester stays dark on every coil or wire, and the engine will not fire.",
    means="A shared fault (crank sensor, ignition power, a blown ignition fuse, or the module) is more likely than every coil dying at once.",
    keywords=["no spark", "ignition", "crank sensor"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL, "Use a proper spark tester. Do not hold a plug wire in your hand or jump a coil to ground in a way that can damage a module."],
    difficulty="moderate",
    related_dtcs=["P0335", "P0340", "P0351"],
    causes=[
        C("No rpm signal (crankshaft or camshaft sensor)", "high", [
            scan_codes("Watch the rpm PID while cranking."),
            T("Scan tool rpm PID, and a meter or scope at the sensor if rpm stays at zero",
              "If rpm stays at zero, test the crank sensor power, ground, and signal per the manual.",
              "Rpm is reported while cranking and a spark tester then fires",
              "Rpm stays at zero, or the sensor has no power/ground/signal",
              MANUAL),
        ], "Repair the sensor, reluctor, or wiring. Recheck spark."),
        C("No ignition power or ground at the coils", "high", [
            multimeter_power("a coil connector on the shared feed"),
        ], "Repair the fuse, relay, or ground. Recheck spark on a tester."),
        C("Failed module or a failed immobilizer cut of spark", "medium", [
            T("Scan tool immobilizer status and the manual's ignition-module functional test",
              "Confirm the module is commanded to fire and is not in a theft lock-out.",
              "An authorized key and a module that is being commanded to fire",
              "A theft lock-out or a module that has power but never fires any coil"),
        ], "Follow the immobilizer or module diagnostic. Do not replace every coil first."),
    ],
))

add(dict(
    id="ign-weak-spark",
    system="ignition",
    title="Weak spark, worn plugs, or a high-mileage ignition path",
    symptom="A hesitation, a misfire under load, a longer-than-normal start, or plugs that are overdue and look worn or sooty.",
    means="Spark has to jump a gap under cylinder pressure. A worn plug, a cracked boot, or a weak coil will fail under load first. Gap and torque come from the service manual.",
    keywords=["weak spark", "worn plugs", "tune up", "coils"],
    tier="generated-general",
    sources=["fueleconomy"],
    safety=[SAFE_RUNNING],
    difficulty="easy",
    related_dtcs=["P0300", "P0351"],
    causes=[
        C("Worn, fouled, or incorrectly gapped plugs", "high", [
            T("Plug socket, gap tool, and eyes on the insulator and the color of the tip",
              "Compare the gap, wear, and deposits with the service manual. FuelEconomy.gov includes ignition-system condition in a poor-economy checklist.",
              "Plugs are in the manual's gap and show a normal tan or light color",
              "A wide gap, a cracked insulator, oil or coolant fouling, or heavy deposits",
              MANUAL),
        ], "Replace the plugs with the specified type, gap, and torque. Inspect coils and boots while they are off."),
        C("Failed coil or a carbon-tracked boot", "medium", [
            T("Spark tester under a safe load, or a documented coil swap, plus a close look at the boot",
              "Look for a puncture or a white/carbon track inside the boot.",
              "A crisp spark and a clean boot",
              "A track, a puncture, or a misfire that follows the coil"),
        ], "Replace the failed coil and boot. Use the grease or boot the manual specifies, if any."),
    ],
))

add(dict(
    id="ign-cam-crank-correlation",
    system="ignition",
    title="Cam/crank correlation error, or a jumped timing chain or belt",
    symptom="A hard start or no start, a rattle on cold start (chain), or a correlation code (P0016 family). The engine may have a jumped tooth after a low-oil event or a worn tensioner.",
    means="The module sees the cam and crank in the wrong relationship. That can be a sensor, a slipped reluctor, or actually jumped timing. Do not assume it is only a sensor.",
    keywords=["P0016", "timing chain", "correlation", "jumped time"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_RUNNING, "On an interference engine, a jumped belt or chain can bend valves. Stop cranking once you suspect jumped time."],
    difficulty="advanced",
    related_dtcs=["P0016", "P0011", "P0014", "P0335"],
    causes=[
        C("Failed cam or crank sensor giving a false correlation error", "medium", [
            connector_tug("the cam and crank sensors"),
            T("Scan tool correlation PIDs and the manual's sensor tests",
              "Check power, ground, and the tone-wheel for damage before tearing the front cover off.",
              "Sensors and the reluctor are sound, and the code was caused by a connector or a failed sensor",
              "The sensors are good and the mechanical timing is still wrong"),
        ], "Replace a failed sensor or repair the connector. Recheck the code."),
        C("Jumped or stretched chain or belt, or a failed tensioner", "high", [
            T("The service-manual timing-mark procedure, or a scope correlation if you have one",
              "Set the engine to the manual's marks and compare cam and crank. Listen for a cold-start rattle from the chain area.",
              "Marks line up and correlation is in the manual's range",
              "Marks do not line up, or the chain is slack",
              MANUAL),
        ], "Repair the chain or belt, guides, and tensioner as a set if the manual requires it. Check for bent valves on an interference engine before a hopeful restart."),
    ],
))

add(dict(
    id="ign-coil-pack-one",
    system="ignition",
    title="One coil or coil-pack tower failed",
    symptom="A misfire on one or two cylinders that a coil-on-plug or a wasted-spark pack serves together.",
    means="A single coil failure is common. On wasted-spark packs, two cylinders share a coil — a swap or a tester will show it.",
    keywords=["coil pack", "COP", "P0351", "ignition coil"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_RUNNING],
    difficulty="easy",
    related_dtcs=["P0351", "P0352", "P0301"],
    causes=[
        C("Failed coil winding or a cracked housing", "high", [
            T("A documented swap of the suspect coil to another cylinder, or a spark tester on that tower",
              "See whether the misfire or the coil code follows the coil.",
              "The problem moves with the coil, or the tester is dark only on that tower",
              "The problem stays on the cylinder after a known-good coil is installed — look at the plug, injector, or compression"),
        ], "Replace the failed coil. Inspect the plug well for oil or coolant, which will ruin a new coil."),
    ],
))

add(dict(
    id="ign-distributor-cap",
    system="ignition",
    title="Distributor, cap, or rotor problems (older ignition)",
    symptom="On an engine that still has a distributor: a wet-weather misfire, a visible carbon track in the cap, or a worn rotor.",
    means="Caps and rotors still fail on older vehicles. Oil in a cap, a worn button, or a loose distributor can all cut spark.",
    keywords=["distributor", "cap and rotor", "ignition module"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=["P0300"],
    causes=[
        C("Carbon-tracked cap, worn rotor, or oil in the cap", "high", [
            T("Screwdriver or the cap clips, eyes inside the cap, and a look at the rotor tip",
              "Look for a white or black track, a worn rotor button, moisture, or oil.",
              "Clean, dry, no track, and a serviceable rotor",
              "A track, a burned terminal, or oil in the cap"),
        ], "Replace the cap and rotor as a set. Find why oil is in the cap (a bad seal) before installing the new one."),
        C("Loose distributor or incorrect base timing", "medium", [
            T("Timing light if the engine has a timing mark, and a check that the distributor is tight",
              "Confirm the hold-down is tight and, if the engine is not fully computer-timed, that base timing is at the manual's figure.",
              "The distributor is tight and timing is at the specification",
              "The housing can be twisted by hand, or timing is off the mark",
              MANUAL),
        ], "Set timing the manual's way and tighten the hold-down to the listed torque."),
    ],
))

add(dict(
    id="ign-timing-belt-noise",
    system="ignition",
    title="Timing-belt or timing-chain noise, or an overdue belt",
    symptom="A dry rattle or slap from the front of the engine on start, or a timing belt that is past the replacement interval in the service manual.",
    means="A failed belt or chain can stop the engine or bend valves. Interval and procedure are vehicle-specific.",
    keywords=["timing belt", "timing chain rattle", "overdue belt"],
    tier="generated-general",
    sources=[],
    safety=["On an interference engine, a broken belt can bend valves. Do not keep running a rattling chain 'until it gets worse.'"],
    difficulty="advanced",
    related_dtcs=["P0016"],
    causes=[
        C("Worn belt, chain, guides, or tensioner", "high", [
            T("The service-manual inspection interval and a visual or a cold-start listen at the cover",
              "If the cover allows a look, check for a glazed, cracked, or oil-soaked belt, or a slack chain. Otherwise treat an overdue interval as a scheduled replacement.",
              "The belt or chain is within interval and is quiet, with correct tension",
              "A cracked belt, a cold-start rattle, or an interval that is past due",
              MANUAL),
        ], "Replace the belt or chain, tensioner, and seals as a kit if the manual groups them. Check valve clearance or a leak-down if the belt already jumped."),
    ],
))

add(dict(
    id="ign-spark-plug-wires",
    system="ignition",
    title="High-tension spark-plug wires (when equipped)",
    symptom="A snap in the dark, a misfire when wet, or visible cracks in plug wires on an engine that still uses them.",
    means="Wires fail from heat, oil, and age. Resistance values, if used, come from the service manual — do not invent a kΩ-per-foot number.",
    keywords=["plug wires", "spark plug wires", "ignition cables"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_RUNNING],
    difficulty="easy",
    related_dtcs=["P0300"],
    causes=[
        C("Cracked, burned, or open plug wires", "high", [
            T("Eyes in a dim area, a gentle squeeze along each wire, and an ohmmeter only at the manual's specification",
              "Look for cracks, burn marks where a wire rests on a manifold, and a loose boot. Measure resistance only if the manual lists a range.",
              "Wires are intact and, if measured, they fall in the manual's range",
              "A crack, a burn-through, a boot that falls off, or a wire well outside the listed resistance",
              MANUAL),
        ], "Replace the wires as a set if they are aged, routed exactly as they came off, and seated on the coil and plugs."),
    ],
))

add(dict(
    id="ign-security-no-spark",
    system="ignition",
    title="Security or immobilizer cut — crank, no spark or no injection",
    symptom="The engine cranks, a security lamp flashes in a 'not recognized' pattern, and there is no spark or no injector pulse.",
    means="The anti-theft system is doing its job, or a key, antenna ring, or module has failed. This is not a coil problem until the immobilizer status is proven.",
    keywords=["immobilizer", "security light", "chip key", "no spark security"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Unrecognized key, a failed transponder, or a failed antenna ring", "high", [
            T("A second programmed key if you have one, plus a scan of the immobilizer module and a look at the security lamp",
              "Try a known-good programmed key. Read theft codes.",
              "A programmed key starts the engine and the lamp behaves as the manual describes for an authorized start",
              "No programmed key is accepted, or the lamp stays in the theft pattern"),
        ], "Follow the service-manual key-programming and antenna-ring tests. Do not 'bypass' theft systems in a way the law or the vehicle forbids."),
    ],
))

print("after ignition", len(ENTRIES))

# ---------------------------------------------------------------------------
# Starting / charging / battery
# ---------------------------------------------------------------------------
add(dict(
    id="chg-dead-morning",
    system="starting_charging",
    title="Dead battery in the morning, or the vehicle always needs a jump",
    symptom="The engine started last night, and this morning the battery is too low to crank. A jump starts it. FTC: clean and test the battery before replacing it; loose or corroded terminals can make it appear dead.",
    keywords=["dead battery", "needs a jump", "overnight drain", "parasitic"],
    tier="cited",
    sources=["ftc_basics", "doe_battery"],
    safety=[SAFE_BATT],
    difficulty="moderate",
    related_dtcs=["P0562"],
    causes=[
        C("A battery that will not hold a charge, or dirty terminals", "high", [
            T("Digital multimeter after an overnight rest, and a load or conductance tester",
              "Clean the terminals first (FTC). Measure rested open-circuit voltage, then load-test.",
              "Rested voltage and a load test are in the service-manual or tester 'pass' range, and the clamps are clean and tight",
              "The battery fails a load or conductance test, or the terminals were the whole problem and a clean-and-retest passes",
              SPEC_DOE_OCV),
        ], "Clean the terminals. Replace the battery only if it fails a real test. Confirm the charging system after a replacement."),
        C("Charging system not replenishing the battery", "high", [
            T("Digital multimeter at the battery with the engine running, lights and blower on, then off",
              "Measure running voltage at the posts at idle and a slightly raised rpm.",
              "Running voltage is in the service-manual charging range (use the manual, not a guessed number)",
              "Voltage stays at a discharged-battery reading, or climbs well above the manual's upper limit",
              MANUAL),
        ], "See the battery-light and overcharging entries. Repair the alternator, belt, or wiring."),
        C("Parasitic drain (a lamp, module, or accessory that does not go to sleep)", "medium", [
            T("DC current clamp or a meter in series, used only after you understand the vehicle's sleep time — many modules stay awake for a period listed in the service manual",
              "With the vehicle shut down, doors closed, and after the manual's sleep time, measure resting current. Do not pull fuses at random on a vehicle that will wake the network; follow the manual's isolation method.",
              "Resting current is in the service-manual sleep range",
              "Current stays high after the sleep time — isolate the circuit the manual's way",
              MANUAL),
        ], "Find the circuit that stays awake (a glove-box lamp, an aftermarket accessory, or a module) and repair it. Recheck an overnight rest."),
    ],
))

add(dict(
    id="chg-battery-light-on",
    system="starting_charging",
    title="Battery or charging lamp on while the engine is running",
    symptom="A battery, ALT, or GEN lamp is on at idle or at speed, and accessories may dim. FTC: loose wiring can make an alternator appear defective — check connections and perform an output test before replacing it.",
    keywords=["battery light", "charging light", "alternator", "ALT lamp"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BATT, SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=["P0562", "P0563"],
    causes=[
        C("Loose belt, loose alternator or battery connections, or a failed fusible link", "high", [
            T("Eyes on the belt and a tug at the battery and alternator terminals, engine off",
              "Confirm belt tension and condition, and that the B+ cable, ground, and connector are tight and clean (FTC).",
              "The belt is tight and in one piece, and the terminals are clean and tight",
              "A glazed, loose, or missing belt, or a burned fusible link or loose B+ cable"),
        ], "Replace the belt or repair the cable or link. Retest charging voltage."),
        C("Alternator not producing, or a failed regulator", "high", [
            T("Digital multimeter at the battery and at the alternator B+ stud, engine running, plus the manual's output test",
              "Measure voltage at idle and with a load (headlights and blower). FTC calls for an output test before replacement.",
              "Voltage is in the manual's charging range at the battery and at the alternator stud",
              "Little or no rise above rest voltage, or a large drop between the alternator stud and the battery — repair the cable or the alternator as the readings indicate",
              MANUAL),
        ], "Replace the alternator or regulator only after the output test fails and the wiring has been proven. Recheck voltage with a load."),
    ],
))

add(dict(
    id="chg-dim-lights-idle",
    system="starting_charging",
    title="Lights dim at idle, then brighten when you rev the engine",
    symptom="Headlights or the dash lights sag at a stop, then recover when you raise rpm. The battery lamp may or may not be on.",
    means="Idle output is marginal: a slipping belt, a weak alternator, a high accessory load, or an idle speed that is too low for this charging system.",
    keywords=["dim lights", "idle dim", "lights brighten with rpm"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING, SAFE_BATT],
    difficulty="moderate",
    related_dtcs=["P0562"],
    causes=[
        C("Slipping belt or a weak alternator at idle", "high", [
            T("Digital multimeter at the battery at idle and at a raised rpm, plus a look at the belt",
              "Record voltage at both speeds, with headlights on.",
              "Idle voltage stays in the manual's charging range even with lights on",
              "Idle voltage sags into a discharged range and recovers only when you raise rpm",
              MANUAL),
        ], "Service the belt and tensioner first. If the belt is sound, test the alternator the manual's way."),
    ],
))

add(dict(
    id="chg-overcharge",
    system="starting_charging",
    title="Overcharging — bulbs burn out, battery uses water, or a high-voltage reading",
    symptom="Headlamps or interior bulbs fail often, the battery smells sharp or uses a lot of water (if it has caps), or a meter shows a running voltage clearly above the service-manual charging range.",
    means="A failed regulator (often inside the alternator) can cook a battery and electronics. Confirm the reading at the battery posts, not only a cheap plug-in gauge.",
    keywords=["overcharging", "battery boiling", "high voltage", "P0563"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BATT, "A boiling battery can vent acid and hydrogen. Ventilate. Do not smoke. Do not overcharge a frozen battery."],
    difficulty="moderate",
    related_dtcs=["P0563"],
    causes=[
        C("Failed voltage regulator or a poor sense circuit", "high", [
            T("Digital multimeter at the battery posts, engine running, a moderate load, then a raised rpm",
              "Compare running voltage with the upper limit in the service manual.",
              "Voltage stays in the manual's charging range as rpm and load change",
              "Voltage climbs past the manual's upper limit and stays there",
              MANUAL),
        ], "Replace the alternator or regulator as the vehicle is built. Test and likely replace a cooked battery after the charging voltage is corrected."),
    ],
))

add(dict(
    id="chg-alternator-noise",
    system="starting_charging",
    title="Alternator bearing or pulley noise",
    symptom="A growl, squeal, or rattle from the alternator that changes with engine speed, sometimes worse with headlights on.",
    means="Bearings and overrunning pulleys fail. Confirm the sound with a careful stethoscope on the case, and do not confuse it with a belt or a tensioner.",
    keywords=["alternator noise", "alternator bearing", "pulley"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Failed alternator bearing or a failed overrunning pulley", "high", [
            T("Mechanic's stethoscope, engine running, plus a spin check of the pulley with the belt removed if the manual allows",
              "Localize the growl. With the belt off (engine off), spin the pulley and feel for roughness or a pulley that freewheels the wrong way.",
              "The alternator is quiet and the pulley spins smoothly in the way the manual describes",
              "A growl in the case or a pulley that is rough or seized"),
        ], "Replace the alternator or the pulley. Recheck belt alignment."),
    ],
))

add(dict(
    id="chg-slow-crank",
    system="starting_charging",
    title="Slow crank — the engine turns over sluggishly",
    symptom="The starter turns the engine, but slowly, especially when cold. It may still start.",
    means="Slow cranks are usually a weak battery, high-resistance cables, or thick oil in extreme cold — not a 'tired starter' as the first guess. FTC: test the battery and connections first.",
    keywords=["slow crank", "sluggish starter", "weak crank"],
    tier="cited",
    sources=["ftc_basics", "doe_battery"],
    safety=[SAFE_BATT],
    difficulty="easy",
    related_dtcs=["P0562"],
    related_jobs=["starter"],
    causes=[
        C("Weak battery or dirty terminals", "high", [
            T("Digital multimeter during the slow crank, and a load test",
              "Measure cranking voltage at the posts and inspect the terminals.",
              "Cranking voltage stays in the manual's range and the battery passes a load test",
              "Voltage collapses or the battery fails a load test",
              MANUAL),
        ], "Clean the terminals. Charge and load-test. Replace the battery if it fails."),
        C("High-resistance cables, or oil that is far too heavy for the temperature", "medium", [
            T("Voltage-drop test on both cables, and a check of the oil grade against the owner's manual for the ambient temperature",
              "Measure drop during the crank, and confirm the oil viscosity is one the manual lists for this climate.",
              "Cable drops are in the manual's range and the oil grade is correct",
              "A large cable drop, or oil that is much heavier than the manual allows for this cold",
              MANUAL),
        ], "Repair the cables, or change to a viscosity the manual lists for the temperature."),
    ],
))

add(dict(
    id="chg-starter-stays-engaged",
    system="starting_charging",
    title="Starter stays engaged, or a grind after the engine starts",
    symptom="After the engine fires, you hear a grind or the starter continues to spin. You may smell a hot starter.",
    means="The solenoid is not releasing, the starter is mechanically stuck, or the ignition switch is still in Start. Stop the engine before the starter is destroyed.",
    keywords=["starter grind", "starter stays on", "solenoid stuck"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BATT, "If the starter stays on, shut the engine down immediately and disconnect the battery if it is safe to do so."],
    difficulty="moderate",
    related_jobs=["starter"],
    related_dtcs=[],
    causes=[
        C("Stuck solenoid or a start signal that remains hot", "high", [
            T("A meter on the starter's small trigger wire after the key is released to Run",
              "The trigger should go away when you release Start. If it does, and the starter still grinds, the solenoid or drive is stuck.",
              "The trigger drops as soon as the key is released, and the starter pinion retracts",
              "The trigger stays hot (ignition switch or relay) or the trigger is gone and the starter still spins"),
        ], "Repair the switch or relay if the trigger stays hot. Replace a stuck starter if the trigger is off and it still grinds."),
    ],
))

add(dict(
    id="chg-jump-start-safety",
    system="starting_charging",
    title="Jump-start that does not take, or a vehicle that dies right after a jump",
    symptom="A jump attempt produces no crank, a pop, or a start that dies as soon as the cables come off.",
    means="Wrong cable order, a broken ground, a completely open battery, or a charging system that is not taking over can all look like a 'bad jump.' The charging system has to run the vehicle once the jump is removed.",
    keywords=["jump start", "dies after jump", "jumper cables"],
    tier="generated-general",
    sources=["ftc_basics", "doe_battery"],
    safety=[SAFE_BATT, "Do not jump a frozen or cracked battery. Do not smoke. Follow the owner's-manual clamp order. Keep clamps from touching."],
    difficulty="easy",
    related_dtcs=["P0562"],
    causes=[
        C("Poor clamp contact, a frozen or failed battery, or an open main fuse", "high", [
            T("Eyes on the battery case and the main fusible links, plus a meter at the dead vehicle's posts and at a known engine ground",
              "Confirm the case is not cracked or frozen. Measure voltage at the posts with the jump applied, and confirm a solid ground clamp on bare metal.",
              "The case is intact, voltage appears at the posts, and a start attempt then cranks",
              "A cracked or frozen case, no voltage at the posts, or a missing main link — stop the jump"),
        ], "Repair the open link or replace a failed battery. Do not keep jumping a frozen battery."),
        C("Alternator not taking over after a successful jump", "high", [
            T("Digital multimeter at the posts after the jumper cables are removed and the engine is running",
              "Measure charging voltage.",
              "Voltage is in the manual's charging range without the jump source",
              "Voltage collapses when the cables come off",
              MANUAL),
        ], "Diagnose the charging system. The vehicle will die again if you just keep jumping it."),
    ],
))

add(dict(
    id="chg-parasitic-drain",
    system="starting_charging",
    title="Parasitic battery drain (sleep current too high)",
    symptom="A known-good, fully charged battery goes flat after sitting hours or a few days, and the charging system tests good.",
    means="Something is not going to sleep. Sleep time and an acceptable rest current are vehicle-specific — use the service manual, not a generic milliamp number copied from another car.",
    keywords=["parasitic drain", "key off drain", "sleep current"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BATT, "On many late-model vehicles, pulling fuses at random wakes the network and invalidates the test. Follow the manual."],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("A lamp, aftermarket accessory, or a module that never sleeps", "high", [
            T("DC current clamp or a properly placed meter, after the service-manual sleep time, with doors closed and latent loads accounted for",
              "Measure rest current only after the listed sleep time. Isolate the circuit using the manual's method (often a voltage drop across fuses, not a random fuse-pull).",
              "Rest current is in the service-manual range after sleep",
              "Current stays high — the circuit you isolated stays awake",
              MANUAL),
        ], "Repair the lamp, switch, aftermarket tap, or module that stays awake. Recheck after another full sleep period."),
    ],
))

add(dict(
    id="chg-corroded-terminals",
    system="starting_charging",
    title="Corroded or loose battery terminals",
    symptom="White or green crust on the posts, a clamp that spins, or a no-crank that improves when you wiggle a cable. FTC: corroded or loose terminals can make the battery appear dead — clean and test before replacing it.",
    keywords=["corroded terminals", "green battery", "loose clamp"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BATT, "Battery residue is acidic. Wear eye protection. Neutralize with a method the manual or a battery-safe cleaner allows."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Corrosion or a loose clamp causing a high-resistance connection", "high", [
            T("Eyes, a terminal brush, and a voltage-drop measurement from the post to the clamp during a start attempt",
              "A drop from the lead post to the cable clamp means the joint is the problem (FTC).",
              "The joint is bright, tight, and the drop is in the manual's range",
              "A crusted or spinning clamp, or a clear drop across the joint",
              MANUAL),
        ], "Disconnect negative first, clean to bright metal, tighten correctly, and protect only with a product the manual allows. Retest a start."),
    ],
))

add(dict(
    id="chg-belt-squeal-charge",
    system="starting_charging",
    title="Belt squeal, especially when you first start or turn the A/C or steering on",
    symptom="A shrill squeal related to engine speed, often at cold start or when a load hits the belt. FTC lists a squeal as a loose or worn power-steering, fan, or air-conditioning belt.",
    keywords=["belt squeal", "squeal on start", "serpentine"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING],
    difficulty="easy",
    related_dtcs=["P0562"],
    causes=[
        C("Loose, glazed, or misaligned belt, or a weak tensioner", "high", [
            T("Eyes on the belt rib, a tensioner-position check, and a careful (engine off) check for a seized pulley",
              "Look for glaze, cracks, missing ribs, a tensioner pushed to the end of its travel, or a pulley that does not spin freely.",
              "The belt is in good condition, the tensioner is in its mid-range, and pulleys spin freely",
              "A glazed or cracked belt, a weak tensioner, or a seized pulley"),
        ], "Replace the belt and, if it is weak, the tensioner. Repair a seized pulley before a new belt is destroyed. Never use belt dressing as a repair."),
    ],
))

add(dict(
    id="chg-new-battery-still-dead",
    system="starting_charging",
    title="A new battery already seems weak, or it failed very quickly",
    symptom="A recently replaced battery is low again, or the vehicle still needs jumps.",
    means="Either the charging system or a drain was never fixed, the battery was never fully charged, or the wrong battery was installed. A new battery is not a diagnosis.",
    keywords=["new battery dying", "just replaced battery"],
    tier="generated-general",
    sources=["ftc_basics", "doe_battery"],
    safety=[SAFE_BATT],
    difficulty="moderate",
    related_dtcs=["P0562"],
    causes=[
        C("The charging system or a drain is still present", "high", [
            T("Digital multimeter charging-voltage test and a sleep-current test after the new battery is fully charged",
              "Do not judge a new battery until it has had a complete charge. Then test charging voltage and, if needed, sleep current.",
              "The new battery is fully charged, charging voltage is in the manual's range, and sleep current is in the manual's range",
              "The alternator is not charging, or a drain is still there — the new battery is being destroyed",
              MANUAL),
        ], "Repair the charging or drain problem. Have the new battery load-tested; it may already be damaged."),
    ],
))

# ---------------------------------------------------------------------------
# Electrical / lighting
# ---------------------------------------------------------------------------
add(dict(
    id="elec-one-headlight",
    system="electrical",
    title="One headlight is out",
    symptom="Only one low or high beam is dark. The other side is fine.",
    means="A single lamp is usually the bulb, the socket, or that side's ground or feed — not the whole alternator. Prove the socket before buying a module.",
    keywords=["headlight out", "one headlight", "bulb"],
    tier="generated-general",
    sources=[],
    safety=["Headlights may be hot. Disconnect the battery if the manual says so around airbag-adjacent lighting. Aim headlights after a replacement if the manual requires it."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Failed bulb or a burned socket", "high", [
            T("A known-good bulb of the exact type, plus eyes on the socket for heat damage",
              "Swap to the good side only if the connectors match, or test the socket for power and ground with the lamp commanded on.",
              "The socket has power and ground, and a new correct bulb lights",
              "A melted socket, no ground, or no feed — repair the socket or wiring; a new bulb will fail again"),
        ], "Replace the bulb or socket. Use the specified type. Do not touch a halogen glass with oily fingers."),
    ],
))

add(dict(
    id="elec-both-headlights",
    system="electrical",
    title="Both headlights out, or they die together",
    symptom="Both low beams, or the entire headlamp system, go dark together.",
    means="A shared fuse, relay, switch, or module is more likely than two bulbs at the same instant — unless they were both overdue.",
    keywords=["both headlights", "headlights dead"],
    tier="generated-general",
    sources=[],
    safety=["Do not drive without lights after dark. Work off the road."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Shared fuse, relay, or a headlamp switch / module failure", "high", [
            T("The fuse chart, a meter at a headlamp connector, and a relay swap with a same-type known-good relay if the manual allows it",
              "Check the headlamp fuse or fusible link, the relay, and whether power arrives at both lamps when they are commanded.",
              "A fuse or relay was the cause, and both lamps light after the repair",
              "Power never arrives, or a module is not commanding — follow the wiring diagram",
              MANUAL),
        ], "Replace a failed fuse only after you know why it blew. Repair the switch, relay, or module the diagram names."),
    ],
))

add(dict(
    id="elec-brake-lights",
    system="electrical",
    title="Brake lights out, or they stay on",
    symptom="No brake lamps when you press the pedal, only one side works, or the lamps stay on and can drain the battery.",
    means="A center high-mount and the two rear lamps often share a switch at the pedal. A stuck switch will also confuse cruise and a transmission module on some vehicles.",
    keywords=["brake lights", "stop lamps", "brake switch"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=["Driving without brake lights is a collision risk. A lamp that stays on can cook the bulbs and drain the battery."],
    difficulty="easy",
    related_dtcs=["P0572", "P0573"],
    causes=[
        C("Failed bulbs, a failed brake-lamp switch, or a blown fuse", "high", [
            T("A helper at the pedal, eyes on all three lamp positions, plus a meter at the switch if the lamps do not change",
              "Confirm which lamps fail. Check the fuse. At the switch, watch the circuit change when the pedal is pressed, per the manual.",
              "Every brake lamp lights with the pedal and goes out when it is released",
              "No change at the switch, a dead fuse, or a lamp that stays on because the switch never opens"),
        ], "Replace the failed bulb, fuse, or switch, and adjust the pedal switch the manual's way so the lamps go out at rest."),
    ],
))

add(dict(
    id="elec-turn-signal-fast",
    system="electrical",
    title="Turn signal flashes fast on one side",
    symptom="The indicator in the dash, and that side's lamps, blink faster than the other side.",
    means="A classic sign of a burned-out bulb on that side, or a poor ground, or (on LED-converted lamps) a load the flasher does not recognize.",
    keywords=["fast flash", "hyperflash", "turn signal"],
    tier="generated-general",
    sources=[],
    safety=[],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Burned bulb, poor ground, or an LED conversion the flasher does not like", "high", [
            T("Eyes on every lamp on that side, including a rear or fender repeater, plus a wiggle at the socket ground",
              "Compare both sides. Replace a dark bulb with the specified type. Check the socket ground.",
              "All lamps light and the flash rate matches the good side",
              "A dark bulb, a corroded ground, or a flash rate that is still fast after the bulbs are proven — look at the flasher or an LED mismatch"),
        ], "Replace the bulb or repair the ground. If LED lamps were fitted, use a compatible flasher or the load method the vehicle maker allows — do not invent a resistor value."),
    ],
))

add(dict(
    id="elec-interior-stays-on",
    system="electrical",
    title="Interior lights stay on and can drain the battery",
    symptom="Dome, glove, or vanity lamps stay on after the doors are closed, or they come on and never time out.",
    means="A door switch, a failed timer in a body module, or a jammed latch can keep the circuit awake and flatten the battery (see also parasitic drain).",
    keywords=["dome light", "interior lights stay on", "door switch"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BATT],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Door, latch, or glove-box switch that still reads 'open'", "high", [
            T("A walk around every door, the hatch, and the glove box, plus a scan-tool door-ajar PID if the vehicle has one",
              "Close each door firmly. Watch whether the lamp or the PID still shows open.",
              "Every door shows closed and the lamps time out as the manual describes",
              "One latch or switch still shows open, or a lamp has been switched to a constant-on position"),
        ], "Adjust or replace the switch or latch. Confirm the lamps time out and an overnight rest no longer kills the battery."),
    ],
))

add(dict(
    id="elec-fuse-repeats",
    system="electrical",
    title="A fuse blows, then blows again",
    symptom="A replaced fuse opens again, sometimes immediately, sometimes when a load is used.",
    means="The circuit has a short to ground or a device that is drawing far too much current. A bigger fuse is not a repair.",
    keywords=["fuse blows", "repeated fuse", "short"],
    tier="generated-general",
    sources=[],
    safety=["Never replace a fuse with a higher rating. A short can start a fire. Disconnect the battery when inspecting a burned harness."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Short to ground in the harness or a failed load (motor, lamp, or module)", "high", [
            T("The wiring diagram, a meter on resistance to ground with the battery disconnected, and a visual of the harness at chafe points",
              "With the fuse out, see whether the load side is shorted to ground. Unplug the device and see whether the short remains in the harness.",
              "The short goes away with the device unplugged (failed device) or you find a pinched wire and can repair it",
              "A hidden short that still shows with the device unplugged — trace the harness",
              MANUAL),
        ], "Repair the pinched wire or replace the failed device. Refit only the specified fuse rating."),
    ],
))

add(dict(
    id="elec-intermittent",
    system="electrical",
    title="Intermittent electrical problem that comes and goes",
    symptom="A lamp, window, gauge, or module works, then doesn't, often on a bump, in the rain, or when the steering wheel is turned.",
    means="Intermittents are often a connector, a broken wire inside the insulation, a failing ground, or a body-control connector — not a 'bad module' as the first part.",
    keywords=["intermittent electrical", "comes and goes", "wiggle"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BATT],
    difficulty="moderate",
    related_dtcs=["U0100"],
    causes=[
        C("Loose connector, a broken wire, or a poor ground that only fails when it moves", "high", [
            wiggle_harness("the affected device and its ground"),
            T("A meter on the ground and power at the moment the symptom appears",
              "Have a helper reproduce the bump or the steering motion while you watch the meter.",
              "Power and ground stay solid while the vehicle is moved as in the failure",
              "A drop-out that lines up with the motion — repair that joint"),
        ], "Repair the connector, ground, or broken wire. Solder or use the termination the manual calls for; a twist-and-tape joint will fail again."),
    ],
))

add(dict(
    id="elec-aftermarket-drain",
    system="electrical",
    title="Aftermarket accessory causing electrical trouble",
    symptom="A new stereo, trailer harness, alarm, or light bar appeared, and then a drain, a blown fuse, or a module complaint started.",
    means="Poor taps, a circuit that never sleeps, or a ground that was lifted can create drains and network errors. Isolate the accessory before replacing factory modules.",
    keywords=["aftermarket", "stereo", "alarm", "trailer wiring"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BATT, SAFE_SRS],
    difficulty="moderate",
    related_dtcs=["U0100"],
    causes=[
        C("The accessory is still powered with the key off, or it was tapped into the wrong circuit", "high", [
            T("A current measurement with the accessory's fuse pulled, and a visual of the tap",
              "After sleep time, pull only the accessory's protection and see whether rest current returns to the manual's range. Inspect the tap for a poor crimp or a safety-circuit splice (airbag, brake, CAN).",
              "Rest current is normal with the accessory isolated, or the tap was on a switched, fused circuit as the maker intended",
              "The accessory keeps the vehicle awake, or it is spliced into a safety or data circuit"),
        ], "Rewire the accessory on a correctly fused, intended circuit, or remove it. Repair any damaged factory wiring."),
    ],
))

add(dict(
    id="elec-ground-issues",
    system="electrical",
    title="Poor engine or body ground — mixed electrical symptoms",
    symptom="Dim lights, odd gauge behavior, a slow crank, or modules that reset, often with a small voltage difference between the engine, the body, and the battery negative.",
    means="A shared ground that is rusty or loose will make several 'failed' parts look guilty. Voltage-drop the grounds before replacing modules.",
    keywords=["bad ground", "engine ground", "voltage drop ground"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BATT],
    difficulty="moderate",
    related_dtcs=["P0562", "U0100"],
    causes=[
        C("Corroded or loose battery-to-body or engine ground strap", "high", [
            T("Digital multimeter voltage-drop test from the battery negative post to the block and to the body during a load (headlights or a start attempt)",
              "A large drop means the strap or eyelet is the fault.",
              "Drops stay within the service-manual limit",
              "A large drop, a rusty eyelet, or a broken strap",
              MANUAL),
        ], "Clean to bare metal and replace a damaged strap. Torque the fasteners the manual lists. Recheck the symptoms."),
    ],
))

add(dict(
    id="elec-gauge-weird",
    system="electrical",
    title="Gauges or a warning lamp acting unreliably",
    symptom="A gauge jumps, a lamp that should be off stays on, or a cluster self-test looks wrong, sometimes with other electrical oddities.",
    means="Prove whether the sender is telling the truth, whether the cluster is failing, or whether a ground or a low system voltage is confusing everything (FTC lists a check-engine lamp as an engine symptom; other lamps need their own tests).",
    keywords=["gauge", "cluster", "warning lamp", "erratic gauge"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BATT],
    difficulty="moderate",
    related_dtcs=["P0463", "P0118"],
    causes=[
        C("Failed sender, a poor cluster ground, or low system voltage", "high", [
            T("Scan tool PID for that gauge versus a mechanical or infrared reality check, plus a charging-voltage measurement",
              "If the PID is sensible and the gauge is not, the cluster or its ground is next. If the PID is wrong, test the sender.",
              "The PID, the real measurement, and the gauge agree, and charging voltage is in range",
              "A lying sender, a lying cluster, or a system voltage that is clearly too low"),
        ], "Repair the sender, the ground, the charging problem, or the cluster as the comparison indicates."),
    ],
))

print("after electrical", len(ENTRIES))

# ---------------------------------------------------------------------------
# Automatic transmission
# ---------------------------------------------------------------------------
add(dict(
    id="at-hard-shift",
    system="transmission_auto",
    title="Abrupt or hard shifts",
    symptom="The automatic hits a gear with a bang or a jerk, especially on upshifts or into Drive. FTC lists abrupt or hard shifts as a common transmission symptom, and says to check simple items first because transmission repairs are expensive.",
    keywords=["hard shift", "harsh shift", "bang shift", "jerk"],
    tier="cited",
    sources=["ftc_basics"],
    safety=["A sudden harsh engagement can move the vehicle. Set the parking brake when you check fluid. Support the vehicle if you go underneath."],
    difficulty="moderate",
    related_dtcs=["P0700", "P0741", "P0750"],
    causes=[
        C("Fluid level, condition, or a loose hose / an overdue filter (the simple items FTC mentions)", "high", [
            fluid_level("Transmission fluid", "On level ground, in the gear and at the temperature the owner's manual or service manual specifies (many dipsticks are only accurate hot, in Park or Neutral)."),
            T("Eyes and nose on the fluid on the stick or a safe sample",
              "Note a burnt smell, dark fluid, or glitter. Look for a disconnected cooler hose.",
              "Level is in the marked range at the specified temperature and gear, and the fluid is not burnt or glittery",
              "Low, overfull, burnt, or glittery fluid, or a disconnected hose"),
        ], "Correct the level with the fluid type the manual lists. Repair a hose. A badly burnt, glittery fill may mean internal damage — do not just 'flush and hope' without a diagnosis."),
        C("A solenoid, a pressure problem, or a stored transmission code", "medium", [
            scan_codes("A P0700 or a transmission-specific code is a starting point, not a parts order."),
        ], "Follow the code's tests in this app and the service manual. Adaptations may need a relearn after a repair."),
    ],
))

add(dict(
    id="at-delayed-engagement",
    system="transmission_auto",
    title="Delayed or no response from Neutral into Drive or Reverse",
    symptom="You shift into D or R and the vehicle sits for a second or more before it engages, or it never quite takes. FTC lists delayed or no response when shifting from neutral to drive or reverse.",
    keywords=["delayed engagement", "takes a second", "no drive", "no reverse"],
    tier="cited",
    sources=["ftc_basics"],
    safety=["Be ready for a sudden engagement. Test in a clear area."],
    difficulty="moderate",
    related_dtcs=["P0700"],
    causes=[
        C("Low fluid, a leaking pump, or a filter that is starving the pump on the first engagement", "high", [
            fluid_level("Transmission fluid", "Check at the temperature and gear the manual specifies."),
            T("A note of whether the delay is only first thing, or every shift into D or R, plus a look for leaks",
              "A delay only when cold can still be low fluid or a worn pump. A leak at the front seal or pan is a clue.",
              "Engagement is prompt with the fluid at the correct level and temperature",
              "A long delay even at the correct level, or a level that drops as the unit warms"),
        ], "Correct the level and repair leaks. If the delay remains, a pressure test per the service manual is next — that may be a shop job."),
    ],
))

add(dict(
    id="at-no-shift",
    system="transmission_auto",
    title="Failure to shift during normal acceleration",
    symptom="The automatic stays in one gear, will not upshift, or is stuck in a limp gear. FTC lists failure to shift during normal acceleration.",
    keywords=["won't shift", "stuck in gear", "limp mode", "no upshift"],
    tier="cited",
    sources=["ftc_basics"],
    safety=["A limp gear can over-rev or leave you with little power in traffic. Get somewhere safe."],
    difficulty="moderate",
    related_dtcs=["P0700", "P0715", "P0720"],
    causes=[
        C("A stored fault putting the unit in limp-in, or a failed speed sensor", "high", [
            scan_codes("Read the engine and transmission modules. A failed input or output speed sensor is a common no-shift cause."),
        ], "Repair the sensor, wiring, or the solenoid the code names. Recheck shifting after a key cycle or the manual's relearn."),
        C("A mechanical or hydraulic failure (valve body, or a broken band/clutch)", "medium", [
            T("A safe road test and a fluid inspection after codes and sensors have been ruled out",
              "Note whether any upshift occurs, and whether the fluid is burnt or glittery.",
              "Sensors and codes are clean and the unit still will not shift — a hydraulic or hard-parts diagnosis is next",
              "Burnt, glittery fluid or a complete lack of any shift after electrical causes are ruled out"),
        ], "This may be a valve-body or overhaul job. Get a pressure test per the service manual before authorizing a rebuild."),
    ],
))

add(dict(
    id="at-slips",
    system="transmission_auto",
    title="Slippage during acceleration — engine revs, the vehicle does not respond",
    symptom="The engine climbs in rpm and the vehicle does not pick up speed as it should, in Drive or in a particular gear. FTC lists this exact pattern as a common transmission symptom.",
    keywords=["transmission slip", "slipping", "revs without moving"],
    tier="cited",
    sources=["ftc_basics", "fueleconomy"],
    safety=["A sudden catch after a slip can jerk the driveline. Test in a clear area."],
    difficulty="moderate",
    related_dtcs=["P0741", "P0700"],
    causes=[
        C("Low or burnt fluid, or a leaking cooler line", "high", [
            fluid_level("Transmission fluid", "Check at the specified temperature and gear."),
            visual_leak("at the cooler lines, pan, and tailshaft (red oily fluid — see also the leak entries)"),
        ], "Correct the level, repair the leak, and reassess. Burnt fluid with a slip often means internal clutch wear."),
        C("Worn clutch pack, a failing torque-converter clutch, or a pressure problem", "medium", [
            T("A safe road test with a scan tool watching commanded gear, slip, and converter lock-up if those PIDs exist",
              "See whether the slip is in one gear, in all gears, or only when lock-up is commanded.",
              "Commanded gear matches a solid road speed, and lock-up does not flare",
              "Rpm flares against a commanded gear, or lock-up shudders and slips"),
        ], "A confirmed internal slip is a rebuild or a converter job. Do not keep driving a unit that is burning fluid."),
    ],
))

add(dict(
    id="at-red-leak",
    system="transmission_auto",
    title="Red oily leak — transmission or power-steering fluid",
    symptom="A red oily spot under the middle or front of the vehicle. FTC: a red oily spot indicates a transmission or power-steering fluid leak. You still have to trace which system.",
    keywords=["red leak", "transmission leak", "power steering leak"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_JACK, "A large transmission leak can strand you and damage the unit if the level drops."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Transmission cooler line, pan gasket, axle or tailshaft seal, or a power-steering hose", "high", [
            visual_leak("at the transmission pan, cooler lines at the radiator, axle seals, and the power-steering pump and rack hoses — wipe and recheck so you know which red fluid it is"),
            fluid_level("Transmission fluid and then power-steering fluid", "Check both reservoirs so you know which one is falling."),
        ], "Repair the line, gasket, or seal that is actually wet. Refill with the fluid type that system uses — they are not interchangeable unless the manual says so."),
    ],
))

add(dict(
    id="at-burnt-fluid",
    system="transmission_auto",
    title="Burnt-smelling transmission fluid",
    symptom="The dipstick or a leak smells burnt and the fluid is dark. Shifts may already be slipping or harsh.",
    means="Burnt fluid usually means the clutches have been slipping and overheating. A 'flush' does not undo burned friction material. FTC still wants the simple items checked first.",
    keywords=["burnt transmission fluid", "dark trans fluid", "burnt smell"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[],
    difficulty="advanced",
    related_dtcs=["P0700"],
    causes=[
        C("Overheated or slipping internal clutches, or a plugged cooler", "high", [
            T("Eyes and nose on the fluid, plus a look at the cooler flow if the manual has a procedure",
              "Note color, smell, and glitter. Ask whether the vehicle was used to tow or was low on fluid.",
              "Fluid is not burnt and there is no glitter — look at other shift causes",
              "A burnt smell, very dark fluid, or metal glitter"),
        ], "Treat this as a possible internal failure. A cooler flush and a fluid change are only a repair if the unit then works and the debris was limited — many units will need a rebuild. Get a honest inspection."),
    ],
))

add(dict(
    id="at-converter-shudder",
    system="transmission_auto",
    title="Torque-converter shudder on light cruise",
    symptom="A brief shake, as if you drove over a rumble strip, at a light-throttle cruise, often around the speed where lock-up applies. It may go away if you add a little throttle or if you disable lock-up.",
    means="The converter clutch is grabbing unevenly. Fluid condition, the wrong fluid, or a worn converter can all cause it.",
    keywords=["converter shudder", "lockup shudder", "rumble strip shake"],
    tier="generated-general",
    sources=["fueleconomy"],
    safety=[],
    difficulty="moderate",
    related_dtcs=["P0741"],
    causes=[
        C("Degraded or incorrect fluid, or a worn converter clutch", "high", [
            T("A safe road test with a scan tool watching TCC command, plus a fluid-type and condition check",
              "See whether the shudder happens only when lock-up is commanded (FuelEconomy.gov includes lock-up operation in its poor-economy checklist).",
              "Lock-up applies smoothly on the specified fluid",
              "The shudder lines up exactly with TCC apply, or the fluid is the wrong type or is burnt"),
        ], "Use only the fluid the manual lists. A fluid and filter service is a reasonable first repair if the fluid was neglected. A remaining shudder is often a converter or valve-body job."),
    ],
))

add(dict(
    id="at-wont-leave-park",
    system="transmission_auto",
    title="Won't shift out of Park",
    symptom="The shifter will not leave Park, sometimes only when the brake is not pressed firmly, or after a battery disconnect.",
    means="Most late vehicles have a brake-shift interlock. A failed brake-lamp switch, a dead battery, or a failed solenoid at the shifter will trap you in Park. There is often a manual override the owner's manual describes.",
    keywords=["stuck in park", "won't come out of park", "shift interlock"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=["Use the owner's-manual override carefully on level ground, with the parking brake set. The vehicle may roll."],
    difficulty="easy",
    related_dtcs=["P0572"],
    causes=[
        C("Brake-lamp switch, a dead battery, or a failed interlock solenoid", "high", [
            T("A look at the brake lights, a voltmeter at the battery, and the owner's-manual shift-lock override",
              "Confirm the brake lights work. A dead battery often locks the shifter. Try the official override to get to Neutral.",
              "The shifter releases when the brake lights work and the battery is charged",
              "Brake lights are out, the battery is dead, or the solenoid never releases even with a good brake signal"),
        ], "Repair the brake switch or charge the battery. Replace a failed interlock solenoid. Confirm the shifter and the lamps work together."),
    ],
))

add(dict(
    id="at-overheat",
    system="transmission_auto",
    title="Transmission overheating, or a trans-temp warning",
    symptom="A transmission-temperature warning, a burnt smell from under the floor, or a harsh or slipping shift after a long grade or a tow.",
    means="Fluid is too hot. That can be a low level, a plugged cooler, a heavy load, or a unit that is already slipping and making heat.",
    keywords=["transmission overheat", "trans temp", "towing"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=["Stop and let it cool when a trans-temp warning is on. Continued driving can destroy the unit."],
    difficulty="moderate",
    related_dtcs=["P0218"],
    causes=[
        C("Low fluid, a plugged or bypassed cooler, or a load the cooler cannot handle", "high", [
            fluid_level("Transmission fluid", "Check only at the specified temperature and gear, after a cooldown if you just overheated."),
            T("Eyes on the cooler lines and the radiator or auxiliary-cooler fins",
              "Look for a kinked line, a packed auxiliary cooler, or a missing cooler after a recent radiator replacement.",
              "Level is correct and the cooler path is open",
              "A low level, a packed cooler, or a line that was left disconnected"),
        ], "Repair the cooler path and correct the level. If the unit already slipped or smells burnt, treat it as possible internal damage."),
    ],
))

add(dict(
    id="at-neutral-flare",
    system="transmission_auto",
    title="Flare or a tie-up between gears",
    symptom="Rpm jumps (flares) in the middle of an upshift, or the shift feels as if two gears are fighting (a tie-up).",
    means="Shift timing or clutch overlap is wrong. That can be adaptive values after a battery disconnect, a solenoid, or a worn clutch.",
    keywords=["flare", "tie up", "shift overlap"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[],
    difficulty="moderate",
    related_dtcs=["P0700"],
    causes=[
        C("Lost shift adaptations, a solenoid, or a worn clutch", "high", [
            scan_codes("Then a safe road test watching shift PIDs if available."),
            T("The service-manual relearn procedure if one exists, after confirming fluid level and type",
              "If a battery was just replaced, do the relearn before condemning clutches.",
              "The flare or tie-up goes away after a proper relearn and a correct fluid fill",
              "The problem remains after a relearn, or the fluid is burnt"),
        ], "Perform the relearn. If it remains, follow the solenoid or clutch diagnosis in the service manual."),
    ],
))

# ---------------------------------------------------------------------------
# Manual transmission / clutch
# ---------------------------------------------------------------------------
add(dict(
    id="mt-hard-shift",
    system="transmission_manual",
    title="Hard to shift a manual transmission",
    symptom="The lever is stiff, or a gear is hard to reach, especially when the engine is running. It may be easier with the engine off.",
    means="If it is hard only with the engine running, the clutch may not be releasing. If it is hard even with the engine off, look at the shift linkage, cables, or the gear oil.",
    keywords=["hard to shift", "stiff shifter", "manual transmission"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Clutch not fully releasing (pedal, hydraulics, or a seized disc)", "high", [
            T("A test with the engine running versus engine off, plus a look at the hydraulic fluid or cable free play",
              "If every gear is easy with the engine off and hard with it running, the clutch is not releasing. Check the master/slave fluid and the pedal height.",
              "The clutch releases and every gear goes in quietly with the engine running, with the pedal height the manual lists",
              "Gears grind with the engine on and are easy with it off, or the reservoir is low or the pedal is soft",
              MANUAL),
        ], "Bleed or repair the hydraulics, or adjust a cable, as the manual describes. A disc that will not release may need a clutch job."),
        C("Shift cable, bushing, or a low or thick gear oil", "medium", [
            T("Eyes on the shift cables or linkage, and a gear-oil level check",
              "Look for a stretched cable or a worn bushing, and check the box oil if the manual has a fill/level plug.",
              "The linkage is tight and the oil is at the level and type the manual lists",
              "A sloppy or seized cable, or a low fill",
              MANUAL),
        ], "Replace bushings or cables, or service the gear oil with the specified lubricant."),
    ],
))

add(dict(
    id="mt-grinds",
    system="transmission_manual",
    title="Grinds when you select a gear",
    symptom="A grind going into a gear, often second or reverse, sometimes only when the gearbox is cold.",
    means="A grind is the teeth or the synchronizer fighting. Confirm the clutch is releasing before you condemn the synchronizers.",
    keywords=["grinds into gear", "synchro", "gear grind"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Clutch not releasing fully", "high", [
            T("The engine-off versus engine-on shift test, and a hydraulic or cable check",
              "If a pause with the pedal down (a few seconds) lets the gear go in quietly, the clutch may be dragging.",
              "Gears go in quietly as soon as the clutch is down",
              "A consistent grind that improves only after a long pause, or a low hydraulic fluid"),
        ], "Repair the clutch release system first."),
        C("Worn synchronizer or a damaged gear", "medium", [
            T("A road or driveway test that notes which gear, which temperature, and whether the clutch is proven to release",
              "A grind in one gear only, with a fully releasing clutch, points at that synchro.",
              "All gears engage quietly with a proven clutch",
              "One gear still grinds after the clutch is proven"),
        ], "This is a gearbox repair. Do not keep forcing a grinding gear."),
    ],
))

add(dict(
    id="mt-clutch-slips",
    system="transmission_manual",
    title="Clutch slips under load",
    symptom="The engine rpm rises on a grade or a hard acceleration, and road speed does not follow. You may smell a hot-friction or burning-resin odor. FTC lists a burning resin or acrid chemical odor as overheated brakes or clutch.",
    keywords=["clutch slips", "burning clutch", "engine revs clutch"],
    tier="cited",
    sources=["ftc_basics"],
    safety=["A slipping clutch can suddenly grab. Get somewhere safe. Let a hot clutch cool."],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Worn clutch disc, oil on the disc, or a pedal that has no free play (always slightly applied)", "high", [
            T("A safe loaded acceleration in a higher gear, plus a look at pedal free play and for an oil leak at the rear main or the transmission input",
              "If rpm flares and speed does not follow, the clutch is slipping. Check that the pedal is fully releasing (free play or a switch/stop).",
              "Rpm and road speed stay locked together under a moderate load, and the pedal has the free play the manual lists",
              "Rpm flares, or the disc is oil-soaked, or the pedal has no release play",
              MANUAL),
        ], "Adjust or repair the release system if it is holding the clutch slightly on. Otherwise this is a clutch replacement, and you must fix the oil leak that soaked it."),
    ],
))

add(dict(
    id="mt-clutch-chatter",
    system="transmission_manual",
    title="Clutch chatters as you take up",
    symptom="The vehicle shudders as the clutch engages, especially from a stop, sometimes worse when hot or when turning (a slightly warped or contaminated disc, or a loose engine/transmission mount).",
    keywords=["clutch chatter", "shudder takeoff", "judder"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Contaminated or glazed disc, or a failed mount that lets the powertrain rock", "high", [
            T("Eyes on the engine and transmission mounts, and a look for an oil leak at the bellhousing",
              "A dripping rear main or a collapsed mount often sits behind chatter.",
              "Mounts are intact and there is no oil at the clutch housing",
              "A collapsed mount or an oil-soaked bellhousing"),
        ], "Replace failed mounts and repair the leak. A contaminated disc needs a clutch job; do not keep driving it."),
    ],
))

add(dict(
    id="mt-throwout-noise",
    system="transmission_manual",
    title="Throw-out bearing or input-shaft noise",
    symptom="A whir or growl that appears when you press the clutch pedal and may go away when you release it (throw-out), or the opposite pattern (input-shaft bearing).",
    means="The pattern with the pedal is the clue. A throw-out bearing is a clutch-job item; an input bearing is a gearbox item.",
    keywords=["throwout bearing", "clutch bearing", "input shaft bearing"],
    tier="generated-general",
    sources=[],
    safety=[],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Worn throw-out bearing, or a worn input-shaft bearing", "high", [
            T("A careful listen in Neutral, engine running, pressing and releasing the clutch (in a safe, stationary test)",
              "A noise that appears as you press the pedal and disappear as you release it is typically the throw-out bearing. A noise that is there in Neutral and quiets when you press the pedal is often the input bearing.",
              "The gearbox is quiet in Neutral with the pedal up and down",
              "A clear pedal-related growl — plan the matching repair"),
        ], "Replace the clutch, bearing, and often the fork as a set, or rebuild the gearbox input, as the pattern indicates."),
    ],
))

add(dict(
    id="mt-gear-oil-leak",
    system="transmission_manual",
    title="Manual-transmission or transfer-case gear-oil leak",
    symptom="A brown or dark oily drip from the gearbox or transfer case, sometimes mistaken for engine oil. The fill may be low and shifting may have become notchy.",
    means="Gear oil is typically not bright red ATF (unless the manual uses ATF in a manual box). Check the correct fluid and the output or input seals.",
    keywords=["gear oil leak", "manual transmission leak", "transfer case leak"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Input, output, or shift-shaft seal, or a loose fill/drain plug", "high", [
            visual_leak("at the bellhousing join, the tailshaft, the shift turret, and both plugs"),
            T("A level check at the fill plug, as the manual shows",
              "Fluid should be at the level the manual lists (often at the fill-hole lip).",
              "The box is dry and the level is correct",
              "A wet seal or a low fill",
              MANUAL),
        ], "Replace the seal or tighten/replace a plug with the specified washer. Refill with the exact lubricant the manual lists."),
    ],
))

# ---------------------------------------------------------------------------
# 4WD / transfer case
# ---------------------------------------------------------------------------
add(dict(
    id="4wd-wont-engage",
    system="four_wd",
    title="Four-wheel drive will not engage",
    symptom="The selector or switch is moved to 4H or 4L, but the vehicle still feels like two-wheel drive, a lamp flashes, or the hubs do not lock.",
    means="Electronic systems need a motor, a sensor, and often a speed interlock. Manual hubs need to be turned. A vacuum-hub system needs intact vacuum lines.",
    keywords=["4WD won't engage", "4H", "hubs", "transfer case"],
    tier="generated-general",
    sources=[],
    safety=["Do not force a transfer-case lever. Binding on dry pavement in 4H can damage the driveline — test in a loose surface if the manual says 4H is part-time."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Manual hubs not locked, or an electronic/vacuum actuator not moving", "high", [
            T("Eyes on the front hubs, a scan tool for the transfer-case module if equipped, and a look at vacuum lines or the shift motor",
              "Lock manual hubs as the owner's manual shows. Watch the actuator or motor when you command 4H. Check fuses.",
              "The hubs lock and the transfer case actually shifts, and the lamp goes steady",
              "The motor never moves, a vacuum line is split, a fuse is dead, or the hubs stay free"),
        ], "Repair the motor, the vacuum line, the fuse, or the hubs. Recheck engagement on a loose surface."),
    ],
))

add(dict(
    id="4wd-stuck-on",
    system="four_wd",
    title="Stuck in four-wheel drive",
    symptom="The vehicle will not return to 2WD. It may bind, hop, or growl on dry pavement, or a 4WD lamp stays on.",
    means="The transfer-case motor or the hubs may be stuck, or the module never received a 2WD command. Binding on pavement in a part-time system is expected until you get it out of 4WD.",
    keywords=["stuck in 4WD", "won't disengage", "binding"],
    tier="generated-general",
    sources=[],
    safety=["Binding on pavement can jump the vehicle sideways. Get to a loose surface to shift out if the manual says to."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Stuck shift motor, stuck hubs, or a transfer case that did not complete a shift", "high", [
            T("A shift attempt on a loose surface as the owner's manual describes, plus a scan or a visual of the motor and hubs",
              "Try 2WD at the speed and in the gear the manual lists. Watch the motor and the hubs.",
              "The case returns to 2WD and the binding stops",
              "The motor is seized, the hubs stay locked, or a lamp still demands 4WD"),
        ], "Repair or replace the motor, hubs, or the shift fork as the inspection shows. Do not keep driving a binding part-time system on dry pavement."),
    ],
))

add(dict(
    id="4wd-binds-pavement",
    system="four_wd",
    title="Driveline bind in 4WD on dry pavement",
    symptom="The vehicle hops, groans, or skips in a tight turn on dry pavement with 4WD selected. It may be normal for a part-time system, or it may mean a full-time / automatic system has a failed center differential or clutch.",
    keywords=["4WD binding", "hop in turns", "dry pavement"],
    tier="generated-general",
    sources=[],
    safety=["A hop in a tight paved turn can push you wide. Ease off and go back to 2WD if the system is part-time."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Part-time 4WD being used on a high-traction surface (often normal), or a failed center differential in a full-time system", "high", [
            T("The owner's manual (part-time vs full-time / automatic) and a test in 2WD versus 4WD on a loose surface",
              "If the manual says part-time 4H is for loose surfaces only, the bind on dry pavement is expected — shift to 2WD. If the system is full-time and it binds, the center differential or a wet clutch may have failed.",
              "A part-time system is smooth in 2WD and only binds in 4H on pavement, as the manual warns",
              "A full-time or automatic system binds in everyday pavement driving"),
        ], "Use part-time 4WD only as the owner's manual describes. A binding full-time system needs a transfer-case diagnosis."),
    ],
))

add(dict(
    id="4wd-transfer-noise",
    system="four_wd",
    title="Transfer-case noise or leak",
    symptom="A growl, rattle, or a leak at the transfer case, sometimes only in 4WD or only in 2WD.",
    means="Low fluid, a worn chain, or a bearing can all make noise. Check the fluid before a teardown.",
    keywords=["transfer case noise", "transfer case leak", "chain rattle"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_JACK],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Low fluid, a worn chain, or a bearing", "high", [
            T("A level check at the fill plug, a look for leaks, and a listen in 2WD and 4WD",
              "Confirm the fluid type and level the manual lists. Note whether the noise is chain-slap or a bearing growl, and in which mode.",
              "The case is dry, the level is correct, and it is quiet in both modes",
              "A low fill, a leak, or a clear mode-related growl",
              MANUAL),
        ], "Service the fluid if it was low and the case is not already full of metal. A remaining noise is a transfer-case repair."),
    ],
))

add(dict(
    id="4wd-hub-not-locking",
    system="four_wd",
    title="Automatic or manual front hub not locking",
    symptom="One front tire does not drive in 4WD, or a manual hub will not click into LOCK, or an automatic hub clicks repeatedly.",
    means="One-side drive in 4WD is a hub, axle, or vacuum-actuator problem until proven otherwise.",
    keywords=["hub not locking", "automatic hubs", "one wheel 4WD"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Failed manual hub, a vacuum leak at an automatic hub, or a broken axle", "high", [
            T("A lock-and-rotate test of each manual hub, a vacuum-line inspection, and a look at whether both front shafts turn in 4WD (vehicle safely supported, as the manual allows)",
              "Confirm each hub locks and that both front axles are driven.",
              "Both hubs lock and both front shafts turn in 4WD",
              "One hub will not lock, a vacuum line is split, or an axle does not turn"),
        ], "Replace the failed hub or vacuum line, or repair the axle. Recheck 4WD on a loose surface."),
    ],
))

add(dict(
    id="4wd-vibration",
    system="four_wd",
    title="Vibration only in 4WD",
    symptom="The vehicle is smooth in 2WD and vibrates or shudders once 4WD is engaged.",
    means="A front driveshaft, a front U-joint, a locked hub runout, or a transfer-case problem is more likely than a rear tire that is also there in 2WD.",
    keywords=["vibration in 4WD", "front driveshaft"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Front driveshaft, U-joint, or a hub/axle problem that only turns in 4WD", "high", [
            T("Eyes on the front shaft and U-joints, a check for play, and a comparison of 2WD versus 4WD on a safe road",
              "Look for a crushed shaft, a dry U-joint, or a missing balance weight.",
              "The front shaft is straight, the joints are tight, and 4WD is smooth on a loose surface",
              "A bad joint, a bent shaft, or a vibration that is clearly only in 4WD"),
        ], "Repair the shaft or joint. Recheck in 4WD."),
    ],
))

print("after 4wd", len(ENTRIES))

# ---------------------------------------------------------------------------
# Drivetrain / axles / CV
# ---------------------------------------------------------------------------
add(dict(
    id="dt-cv-click",
    system="drivetrain",
    title="CV-joint click on turns",
    symptom="A sharp click or pop from a front corner when you accelerate in a tight turn, often worse to one side.",
    means="A classic outer CV-joint failure, usually after the boot has torn and thrown grease. An inner joint more often clunks or vibrates on acceleration in a straight line.",
    keywords=["CV joint", "click on turns", "axle click", "torn boot"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Torn outer CV boot or a worn outer joint", "high", [
            T("Eyes on both boots, and a safe tight-turn acceleration in an empty lot",
              "Look for a split boot and thrown grease on the wheel and the inner fender. Note which side clicks.",
              "Boots are intact and there is no click in a tight loaded turn",
              "A torn boot, missing grease, or a click you can point at one corner"),
        ], "Replace the axle or the joint as a unit if the joint has already clicked. A fresh torn boot with a still-quiet joint can sometimes be a boot kit if the manual allows it and the grease is still clean."),
    ],
))

add(dict(
    id="dt-axle-leak",
    system="drivetrain",
    title="Axle-seal or differential leak",
    symptom="Gear oil or ATF (on some automatics) wet on the inside of a wheel, on the pumpkin, or on a leaf spring.",
    means="A leaking axle seal can also contaminate a brake lining. Check the differential level; a low fill will ruin the gears.",
    keywords=["axle seal", "differential leak", "gear oil on brake"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_JACK, SAFE_BRAKE],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Axle seal, pinion seal, or a cover gasket", "high", [
            visual_leak("at the cover, the pinion, and where the axle enters the housing, and on the back of the brake backing plate"),
            T("A fill-plug level check",
              "Confirm the fluid is at the manual's level and type.",
              "The housing is dry and the level is correct",
              "A wet seal or a low fill",
              MANUAL),
        ], "Replace the seal and, if the brake is soaked, service the brake. Refill with the specified lubricant. A repeat leak may mean a blocked axle-housing vent or a bent shaft."),
    ],
))

add(dict(
    id="dt-driveshaft-vib",
    system="drivetrain",
    title="Driveshaft vibration that rises with road speed",
    symptom="A vibration you feel in the floor, often starting at a particular road speed, that may change if you coast versus accelerate.",
    means="A driveshaft can be unbalanced, bent, or running at the wrong angle after a lift or a collapsed mount. U-joints and a center bearing are part of the same path. FTC lists a rumble from a worn universal joint or drive-line component.",
    keywords=["driveshaft", "vibration at speed", "unbalanced shaft"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Missing balance weight, a bent shaft, or a collapsed transmission or center-bearing mount", "high", [
            T("Eyes on the shaft, a check of the center bearing, and a measurement of ride height / joint angles if the vehicle was lifted",
              "Look for a missing weight, a dent, a torn center bearing, or a transmission mount that has dropped the tail.",
              "The shaft is straight, weights are present, and the mounts are intact",
              "A dent, a missing weight, or a dropped mount that changes the shaft angle"),
        ], "Repair the mount or replace a bent or unbalanced shaft. Recheck at the speed that used to vibrate."),
        C("Worn U-joint", "high", [
            T("Hands on the shaft (vehicle in Park, wheels chocked, or as the manual allows) to feel for play at each joint, plus a look for rust dust",
              "A joint that clunks or has play, or that will not rotate smoothly, is worn.",
              "Each joint is tight and moves smoothly",
              "Play, a bind, or rust-colored dust at a cap"),
        ], "Replace the U-joint or the shaft if the yokes are worn. Grease only if the joint has a fitting."),
    ],
))

add(dict(
    id="dt-u-joint-clunk",
    system="drivetrain",
    title="U-joint clunk on takeoff or when you shift between Drive and Reverse",
    symptom="A single clunk from under the vehicle when you change from Drive to Reverse, or when you take up from a stop.",
    means="FTC lists a rumble from a worn U-joint; a clunk on engagement is the same family. Also consider a worn slip yoke or a loose rear flange.",
    keywords=["u-joint clunk", "clunk into gear", "driveline clunk"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Worn U-joint, slip yoke, or a loose pinion flange", "high", [
            T("A helper shifting between D and R (brakes held) while you listen, plus a play check at each joint and the flange nuts",
              "Localize the clunk. Check flange-nut tightness only against the service-manual method — do not guess a torque and overtighten a crush sleeve.",
              "Joints and the flange are tight, and the clunk is gone",
              "A joint with play, or a loose flange"),
        ], "Replace the joint or repair the flange the manual's way. Recheck D-to-R."),
    ],
))

add(dict(
    id="dt-diff-noise",
    system="drivetrain",
    title="Differential whine or growl",
    symptom="A whine or growl from the axle that changes with road speed, sometimes only on deceleration or only on acceleration.",
    means="Pinion and ring-gear bearings have characteristic patterns (accel vs decel). Low or the wrong lubricant will ruin them quickly. This is not a wheel-bearing noise if it does not change much when you sway the vehicle.",
    keywords=["differential noise", "gear whine", "rear end noise"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Low or wrong lubricant, or worn pinion / carrier bearings", "high", [
            T("A fill-plug level and type check, a magnetic-plug inspection for chips, and a road test that notes accel versus decel",
              "A noise that is clearly in the axle, not the wheels, with a low fill or chips on the magnet is an axle problem.",
              "The level and type are correct and the axle is quiet",
              "A low fill, the wrong fluid, chips, or a speed-related growl from the pumpkin",
              MANUAL),
        ], "Correct the fluid immediately if it was low. A remaining gear noise is a differential repair; setup specs come from the service manual."),
    ],
))

add(dict(
    id="dt-wheel-bearing-hum",
    system="drivetrain",
    title="Wheel-bearing hum that changes when you lean the vehicle",
    symptom="A hum or growl that follows road speed and often changes when you gently sway left or right. It is usually at one corner.",
    means="A loaded wheel bearing howls. Unlike a differential, the sound often changes with a slight steering input that loads one side. Confirm before replacing a differential.",
    keywords=["wheel bearing", "hum at speed", "growl corner"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_JACK, "A severely worn bearing can destroy a hub or a spindle. Do not ignore a roar that is getting worse quickly."],
    difficulty="moderate",
    related_dtcs=["C0035", "C0040"],
    causes=[
        C("Worn wheel bearing or hub assembly", "high", [
            T("A safe road test with a slight left and right lean, then a wheel-wiggle check with the vehicle safely supported",
              "Note which lean makes it worse. With the wheel off the ground (supported on stands), check for play and a rough spin.",
              "No play, a smooth spin, and no lean-sensitive hum",
              "Play, a grind when you spin the wheel, or a hum that clearly changes with a lean"),
        ], "Replace the bearing or the hub assembly the way this vehicle is built. Torque the axle nut to the service manual — this is a critical fastener."),
    ],
))

add(dict(
    id="dt-click-straight",
    system="drivetrain",
    title="Clicking or ticking in a straight line, related to wheel speed",
    symptom="A click that follows road speed even when you are not turning, sometimes mistaken for a CV joint.",
    means="A stone in a tire, a loose wheel cover (FTC lists a click from a loose wheel cover), a missing lug, or a failed inner joint or an ABS ring can all click in a straight line.",
    keywords=["clicking straight", "wheel cover", "stone in tire"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="easy",
    related_dtcs=["C0035"],
    causes=[
        C("Stone in the tread, a loose wheel cover or lugs, or a damaged ABS tone ring", "high", [
            T("Eyes on each tire, the wheel covers, and the lug nuts, plus a close look at the ABS ring if the click remains",
              "FTC lists a loose wheel cover as a click related to vehicle speed. Also pry a stone out of a tread bar if you find one.",
              "The covers are tight, the lugs are at the manual's torque, and nothing is stuck in the tire",
              "A loose cover, a missing or loose lug, a stone, or a bent tone ring",
              MANUAL),
        ], "Tighten or replace the cover, torque the lugs in the correct sequence, or repair the tone ring or inner joint as the leftover sound indicates."),
    ],
))

add(dict(
    id="dt-inner-cv-vibe",
    system="drivetrain",
    title="Inner CV or tripod joint vibration on acceleration",
    symptom="A shudder or vibration under acceleration in a straight line, often on a front-wheel-drive vehicle, that may ease when you lift off.",
    means="An inner tripod joint can shake under load when the boot has failed or the joint is worn. It is a different pattern from an outer-joint click in a turn.",
    keywords=["inner CV", "tripod", "accel vibration FWD"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Worn inner joint or a torn inner boot", "high", [
            T("Eyes on the inner boots, and a safe acceleration versus lift-off comparison",
              "A torn inner boot plus a load-related shudder is a strong pointer.",
              "Inner boots are intact and acceleration is smooth",
              "A torn inner boot or a shudder that is clearly load-related in a straight line"),
        ], "Replace the axle. Recheck under the same acceleration."),
    ],
))

# ---------------------------------------------------------------------------
# Brakes / ABS
# ---------------------------------------------------------------------------
add(dict(
    id="brk-pulls",
    system="brakes",
    title="Vehicle pulls to one side when you apply the brakes",
    symptom="The vehicle yaws left or right as you brake, and it may be straight when you are not braking. FTC: schedule diagnosis if the vehicle pulls to one side when the brakes are applied.",
    keywords=["brake pull", "pulls when braking"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "A strong pull can take you out of the lane. Test in a safe, empty area."],
    difficulty="moderate",
    related_dtcs=["C0035"],
    causes=[
        C("A hose that is restricted on one side, a seized caliper, or contaminated linings on one wheel", "high", [
            T("A safe, light-brake test, then a careful comparison of wheel temperature (after a short, controlled series of stops) and a look at the pads and rotors",
              "A much hotter wheel, a wet oily lining, or a seized slide pin on one side explains a pull.",
              "Both sides of an axle are similarly warm and the linings are clean and moving",
              "One wheel is much hotter, oily, or the caliper does not retract"),
        ], "Repair the hose, the caliper or slides, or the contaminated pads. Bleed as the manual requires. Recheck a straight stop."),
        C("Unequal tire pressure, which can also cause a pull (FTC lists under-inflated tires as a cause of pulling even when not braking)", "medium", [
            T("Accurate tire gauge, tires cold",
              "Compare all four with the door sticker.",
              "All four are at the door-sticker pressure",
              "One tire is clearly low",
              SPEC_TIRE_COLD),
        ], "Inflate to the door sticker and retest the brake pull before replacing brake parts."),
    ],
))

add(dict(
    id="brk-pedal-sinks",
    system="brakes",
    title="Brake pedal sinks to the floor when you hold pressure",
    symptom="The pedal feels firm at first, then fades toward the floor while you hold it, or it is very low. FTC: schedule diagnosis if the brake pedal sinks to the floor when pressure is maintained.",
    keywords=["sinking pedal", "pedal fades", "brake fluid leak", "master cylinder"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "A sinking pedal can become a no-brake event. Do not drive this vehicle until the cause is repaired."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("An external fluid leak, or an internal master-cylinder bypass", "high", [
            T("Eyes at every caliper, wheel cylinder, hose, line, and the master-cylinder cap, plus a reservoir-level check",
              "A wet line or a falling reservoir is an external leak. A dry system with a pedal that still sinks often means the master is bypassing internally.",
              "The reservoir holds, everything is dry, and a held pedal stays high",
              "A wet component, a falling level, or a dry system with a pedal that still sinks"),
        ], "Repair the leaking hose, line, or caliper, or replace a bypassing master cylinder. Bleed the system the manual's way and confirm a firm, holding pedal before you drive."),
    ],
))

add(dict(
    id="brk-scrape-grind",
    system="brakes",
    title="Scraping or grinding during braking",
    symptom="A metallic scrape or grind when you press the pedal, sometimes also a lip you can feel on the rotor. FTC: schedule diagnosis if you hear or feel scraping or grinding during braking.",
    keywords=["grinding brakes", "scraping", "metal on metal"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "Metal-on-metal can suddenly reduce braking. Limit driving until the linings and rotors are inspected."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Pads or shoes worn to the backing plate, or a stone trapped between a rotor and a shield", "high", [
            T("A wheel-off inspection of pads/shoes, rotors/drums, and the dust shield, vehicle safely supported",
              "Measure lining thickness against the service-manual minimum. Look for a trapped stone.",
              "Linings are above the manual's minimum and nothing is trapped",
              "Metal-on-metal, a deeply scored rotor, or a stone in the shield",
              MANUAL),
        ], "Replace the linings and machine or replace the rotors or drums as the manual allows. Remove a trapped stone. Torque the wheel in the correct sequence."),
    ],
))

add(dict(
    id="brk-light-on",
    system="brakes",
    title="Brake warning lamp is on",
    symptom="The red brake lamp (not only the amber ABS lamp) is lit. FTC: schedule diagnosis if the brake light on the instrument panel is lit.",
    keywords=["brake light on", "brake warning lamp", "parking brake lamp"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "A red brake lamp can mean a serious fluid-level or parking-brake problem. Check the level before a long drive."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Parking brake applied or a switch out of adjustment, or a low brake-fluid level", "high", [
            T("A look at the parking-brake position and a check of the reservoir, on level ground",
              "Release the parking brake fully. If the lamp stays on, check the fluid level at the reservoir marks (a leak or worn pads can drop the level).",
              "The parking brake is fully released, the fluid is at the mark, and the lamp is out",
              "The lamp stays on with a low reservoir, a leak, or a switch that never opens"),
        ], "Release or adjust the parking-brake switch. If the fluid is low, find the leak and inspect the linings; then fill with the specified fluid only."),
    ],
))

add(dict(
    id="brk-spongy",
    system="brakes",
    title="Soft or spongy brake pedal",
    symptom="The pedal feels mushy and travel is long, even if it does not keep sinking all the way down.",
    means="Air in the hydraulic system, a flexing hose, or a low level from a leak will soften the pedal. Bleed procedures and a torque sequence are vehicle-specific.",
    keywords=["spongy pedal", "soft brakes", "air in brakes"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Air in the lines, a leak, or a collapsing flexible hose", "high", [
            T("A reservoir check, a look at every hose and caliper, and a two-person or pressure-bleed per the service manual",
              "A hose that swells under a held pedal is failing. Bubbles during a bleed confirm air.",
              "The pedal is firm after a correct bleed, and no hose swells",
              "Bubbles keep appearing, a hose swells, or a leak is visible"),
        ], "Repair the leak or the hose, then bleed in the manual's sequence. Confirm a firm pedal before you drive."),
    ],
))

add(dict(
    id="brk-hard-pedal",
    system="brakes",
    title="Hard pedal with poor stopping power",
    symptom="The pedal is high and hard, but the vehicle does not stop well. You may be pushing much harder than usual.",
    means="A failed brake booster or a missing vacuum / hydraulic assist will make a hard pedal. Binding linings can also feel hard and ineffective.",
    keywords=["hard pedal", "no boost", "brake booster"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "A failed booster can take much more distance to stop. Leave extra room and repair it before highway driving."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Failed vacuum or hydraulic booster, or a leaking booster hose", "high", [
            T("A booster-check the service manual describes (often, with the engine off, pump the pedal, then start the engine and feel for a drop), plus a look at the vacuum hose or a hydro-boost fluid supply",
              "A good vacuum booster usually gives a slight pedal drop as the engine starts after the pedals have been pumped.",
              "The pedal drops slightly on start and assist feels normal, and the hose is intact",
              "No change on start, a hiss at the booster, or a dead hydro-boost supply"),
        ], "Replace a failed hose or booster. On hydro-boost, confirm the power-steering supply as the manual describes."),
    ],
))

add(dict(
    id="brk-vibration",
    system="brakes",
    title="Vibration or a pulsation when you brake",
    symptom="The steering wheel or the pedal shakes when you brake from speed, and is smoother when you are not braking.",
    means="A rotor with thickness variation, rust ridges, or uneven deposits, or a loose wheel, will pulsate under braking. It is not always a 'warped rotor' in the casual sense.",
    keywords=["brake pulsation", "steering shake braking", "warped rotor"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Rotor thickness variation, a rust ridge, or a wheel that is not seated or torqued correctly", "high", [
            T("A wheel-torque check (correct sequence and the manual's figure), then a rotor inspection and a thickness or runout measurement if you have the tools",
              "A wheel that was tightened with an impact in a circle can pulsate. Measure rotor thickness variation against the manual.",
              "The wheel is seated and torqued correctly, and rotor variation is within the manual's limit",
              "A loose or incorrectly torqued wheel, a heavy rust ridge, or variation above the manual's limit",
              MANUAL),
        ], "Reseat and torque the wheels. Machine or replace the rotors as the manual allows, and replace pads if they are uneven. Recheck a stop from speed."),
    ],
))

add(dict(
    id="brk-abs-light",
    system="brakes",
    title="ABS lamp is on (amber)",
    symptom="The amber ABS or stability lamp is lit. Base brakes may still work, but anti-lock may be disabled.",
    means="ABS needs clean wheel-speed signals, power, and a working module. A damaged tone ring or a failed sensor is more common than a failed module. Prove the sensors first.",
    keywords=["ABS light", "stability light", "wheel speed"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "With ABS disabled, the vehicle can lock a wheel on a slick stop. Leave more distance."],
    difficulty="moderate",
    related_dtcs=["C0035", "C0040", "U0121"],
    causes=[
        C("Failed wheel-speed sensor, a damaged tone ring, or a missing ABS fuse", "high", [
            scan_codes("Read the ABS module, not only the engine module."),
            T("A visual of each tone ring and sensor, plus a live wheel-speed PID at a walking pace if the scan tool shows it",
              "Look for a cracked or packed ring, a chafed wire at the knuckle, and a speed PID that stays at zero on one corner.",
              "Every corner reports a similar speed and the rings are intact",
              "One corner stays at zero, or the ring is damaged"),
        ], "Repair the sensor, wiring, or ring. Recheck the lamp after a short drive. Do not start with a module replacement."),
    ],
))

add(dict(
    id="brk-stuck-smoking",
    system="brakes",
    title="Stuck brake, hot wheel, or light smoke from a wheel",
    symptom="A burning-resin or acrid chemical smell, a wheel that is too hot to approach, or light smoke at a wheel. FTC: that odor may be overheated brakes or clutch; light smoke from a wheel indicates a stuck brake and the vehicle should be towed.",
    keywords=["stuck brake", "smoking wheel", "hot wheel", "burning brakes"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "FTC: stop, let the brakes cool, and tow a smoking wheel. Do not keep driving a dragging brake."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Seized caliper, a stuck parking-brake shoe, or a collapsed hose that lets pressure in and not out", "high", [
            T("A careful temperature comparison after a short unbraked stretch (do not grab a scalding wheel), plus an inspection of slides, the parking-brake cable, and the hose once cool",
              "FTC also says to check the parking brake after repeated hard use. A hose that acts as a one-way valve will drag that wheel.",
              "After a cool-down and a release of the parking brake, the wheel spins freely (supported safely) and stays similar in temperature to its pair",
              "The wheel is still locked or much hotter, the cable is taut with the lever off, or the hose is swollen"),
        ], "Repair the caliper, slides, cable, or hose. Replace cooked pads and a heat-spotted rotor as needed. Tow if it is smoking now."),
    ],
))

add(dict(
    id="brk-squeal",
    system="brakes",
    title="Brake screech or squeal — wear indicators or glazed linings",
    symptom="A high-pitched, piercing metallic sound while the vehicle is in motion, often when you brake lightly. FTC: a screech is often the wear indicators telling you it is time for maintenance.",
    keywords=["brake squeal", "screech", "wear indicator"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Wear indicators touching the rotor, or a glaze / a missing shim", "high", [
            T("A wheel-off measurement of lining thickness and a look at the indicator tab and shims",
              "If the tab is the source, the lining is at or near replacement thickness. A squeal with thick pads may be glaze or a missing anti-rattle clip.",
              "Linings are above the manual's minimum, the hardware is complete, and the squeal is gone after a correct service",
              "The wear tab is on the rotor, or the lining is at the minimum",
              MANUAL),
        ], "Replace the pads and any worn rotors, and refit the shims and clips the kit includes. Do not silence a wear tab with grease and keep driving."),
    ],
))

add(dict(
    id="brk-parking-stuck",
    system="brakes",
    title="Parking brake stuck on, or it will not hold",
    symptom="The vehicle drags with the lever or pedal released, or it will not hold on a modest grade when applied. FTC says to check the parking brake when you smell overheated brakes.",
    keywords=["parking brake", "handbrake", "stuck parking brake"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "A stuck parking brake can overheat a rear wheel. A parking brake that will not hold is a roll-away risk."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Seized cable, or shoes/pads out of adjustment or worn out", "high", [
            T("A release-and-spin check of both rear wheels (vehicle safely supported), plus a look at the cable and the lever switch",
              "With the control fully released, both rear wheels should spin. With it applied, they should hold per the manual's check.",
              "The wheels spin when released and hold when applied",
              "A cable that stays taut, a seized lever, or shoes that never contact"),
        ], "Free or replace the cable, adjust the shoes the manual's way, or replace worn linings. Recheck both release and hold."),
    ],
))

add(dict(
    id="brk-fluid-leak",
    system="brakes",
    title="Brake-fluid leak (clear to yellowish, slippery, not oily like engine oil)",
    symptom="A low reservoir, a wet caliper, hose, or line, or a slippery wet spot that is not dark engine oil and not bright-red ATF.",
    means="Brake fluid is usually clear to pale yellow (or the color of the specified DOT fluid) and will damage paint. Any leak is a safety problem.",
    keywords=["brake fluid leak", "wet caliper", "low brake fluid"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "Do not drive a vehicle that is losing brake fluid. Brake fluid damages paint — wipe it carefully."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Failed hose, line, caliper seal, wheel cylinder, or master-cylinder cap/seal", "high", [
            visual_leak("at every hydraulic joint, the hose crimps, and the rear of the master cylinder (a rear seal can leak into the booster)"),
        ], "Replace the failed part, refill with the specified DOT fluid only, and bleed the manual's way. Confirm a firm pedal."),
    ],
))

print("after brakes", len(ENTRIES))

# ---------------------------------------------------------------------------
# Steering / suspension / tires
# ---------------------------------------------------------------------------
add(dict(
    id="sus-wander",
    system="steering_suspension",
    title="Wandering, or difficulty steering in a straight line",
    symptom="You have to keep correcting the steering on a straight, calm road. FTC: misaligned front wheels and/or worn steering components, such as the idler or a ball joint, can cause wandering or difficulty steering in a straight line.",
    keywords=["wander", "won't track", "loose steering", "alignment"],
    tier="cited",
    sources=["ftc_basics", "nhtsa_tires"],
    safety=["A sudden wander can come from a nearly separated joint. If you feel a clunk and a change in aim, stop and have it inspected."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Low or uneven tire pressure", "high", [
            T("Accurate tire gauge, tires cold",
              "Measure all four and compare with the door sticker (NHTSA).",
              "All four are at the door-sticker pressure when cold",
              "One or more are clearly low or very uneven",
              SPEC_TIRE_COLD),
        ], "Inflate to the door sticker and retest tracking before replacing steering parts."),
        C("Worn tie rod, ball joint, or idler/pitman, or a need for alignment", "high", [
            T("A dry-park steering-play check and a lift inspection of each joint (vehicle safely supported), plus a look at tire wear",
              "Have a helper turn the wheel slightly while you watch each joint for lost motion. Inner and outer tie rods, ball joints, and (on a parallelogram steering) the idler are FTC's examples.",
              "No play beyond the manual's allowance, and the tires wear evenly",
              "A joint that visibly opens and closes, or a sawtooth / inner-edge wear pattern",
              MANUAL),
        ], "Replace worn joints and then have the alignment set to the service-manual specifications. Do not 'just align' a worn joint."),
    ],
))

add(dict(
    id="sus-pull-not-braking",
    system="steering_suspension",
    title="Pulls to one side when you are not braking",
    symptom="The vehicle drifts or pulls with your hands lightly on the wheel, on a reasonably flat road. FTC: pulling can be as routine as under-inflated tires, or as serious as a damaged or misaligned front end.",
    keywords=["pulls", "drifts", "alignment pull"],
    tier="cited",
    sources=["ftc_basics", "nhtsa_tires"],
    safety=[],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Under-inflated or mismatched tires", "high", [
            T("Accurate tire gauge, tires cold, plus a check that sizes and load ratings match across an axle",
              "Compare with the door sticker. A recent new tire on only one side can also pull.",
              "Pressures match the door sticker and the tire sizes match on an axle",
              "A low tire, a mixed size, or a very different tread depth on one side",
              SPEC_TIRE_COLD),
        ], "Inflate and, if needed, even out the tire set. Retest on a flat road."),
        C("Alignment, a bent component, or a dragging brake that is mild enough not to feel like 'braking'", "medium", [
            T("A look at the tires for inner- or outer-edge wear, a check for a hot wheel after a short drive, and an alignment check to the manual's figures",
              "A bent control arm or a mild drag can mimic an alignment pull.",
              "Tires wear evenly, no wheel is dragging, and alignment is in the manual's range",
              "A bent part, a hot dragging wheel, or an alignment well out of specification",
              MANUAL),
        ], "Repair the bent part or the drag, then align to the service-manual specifications."),
    ],
))

add(dict(
    id="sus-play-steering",
    system="steering_suspension",
    title="Excess play in the steering wheel",
    symptom="You can move the steering wheel noticeably before the front tires respond, or there is a clunk when you change direction.",
    means="Play lives in the intermediate shaft, a worn rack, a loose gearbox, or the outer joints. Measure it against the service manual, not a guessed inch count.",
    keywords=["steering play", "loose wheel", "dead band"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=["Excess play can become a loss of control. Do not ignore a sudden new looseness."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Worn tie rods, a worn intermediate shaft, or a loose steering-gear mount", "high", [
            T("A dry-park check and a visual of each joint and the steering-gear fasteners, plus a comparison with the play the manual allows at the wheel",
              "Watch the shaft U-joints and the inner tie-rod boots as a helper wiggles the wheel.",
              "Play is within the manual's allowance and every joint is tight",
              "A joint or a shaft that jumps, or a loose steering-gear mount",
              MANUAL),
        ], "Replace the worn part and torque the mounts. Recheck play, then align if a tie rod was replaced."),
    ],
))

add(dict(
    id="sus-heavy-steering",
    system="steering_suspension",
    title="Steering is unusually heavy, or power assist is gone",
    symptom="The wheel is hard to turn at a parking-lot speed, sometimes with a groan, a belt squeal, or a low power-steering level.",
    means="A belt, a low fluid level, a failed pump, a seized steering gear, or (on electric assist) a failed motor or a low charging system can all steal assist.",
    keywords=["heavy steering", "no power steering", "hard to turn"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=["A sudden loss of assist takes much more effort. Slow down and get somewhere safe."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Loose belt or a low power-steering fluid level (hydraulic systems)", "high", [
            T("Eyes on the belt and the power-steering reservoir, plus a look for a red or amber oily leak at the pump and rack (FTC: red oily spots can be power-steering fluid)",
              "A squeal at full lock plus a falling reservoir is a leak or a slipping belt.",
              "The belt is tight and the fluid is at the mark, with no new leak",
              "A loose belt, a low fill, or a wet hose"),
        ], "Repair the leak, fill with the specified fluid, and service the belt. Do not hold the wheel at full lock for more than a moment."),
        C("Failed pump, a seized rack, or a failed electric-assist motor", "medium", [
            T("A groan test at idle (hydraulic) and a scan of the electric-assist module if equipped, plus a charging-voltage check for electric assist",
              "Electric assist often dies when system voltage is low. A hydraulic pump that is quiet at the reservoir but the wheel is still heavy may be a seized gear.",
              "Assist returns when voltage is in the charging range, or a pump pressure test (shop) is in the manual's range",
              "Voltage is good and there is still no assist, or the gear is bound",
              MANUAL),
        ], "Repair the charging problem first on electric assist. Replace a failed pump or gear as the tests indicate."),
    ],
))

add(dict(
    id="sus-ps-leak",
    system="steering_suspension",
    title="Power-steering fluid leak",
    symptom="A red or sometimes clear-amber oily leak at the pump, a hose, or the steering gear, and a falling reservoir. FTC groups a red oily spot with transmission or power-steering fluid.",
    keywords=["power steering leak", "PS fluid", "rack leak"],
    tier="cited",
    sources=["ftc_basics"],
    safety=["A sudden loss of fluid can take away assist. Fluid on a belt will also make it slip."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Hose, pump shaft seal, or a steering-gear seal", "high", [
            visual_leak("at the pump, both hoses, the cooler if equipped, and the rack or gearbox boots"),
            fluid_level("Power-steering fluid", "Check the reservoir with the engine off, at the mark the cap describes."),
        ], "Replace the failed hose or the leaking unit. Fill only with the fluid the manual lists (some systems are no longer conventional ATF). Bleed as instructed."),
    ],
))

add(dict(
    id="sus-clunk-bumps",
    system="steering_suspension",
    title="Clunk over bumps",
    symptom="A random thump from a corner or from underneath when you hit a bump or a driveway. FTC: a clunk can be a loose shock absorber or other suspension component, or a loose exhaust.",
    keywords=["clunk over bumps", "suspension clunk", "loose shock"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Worn shock or strut mount, a loose stabilizer-bar link, or a worn control-arm bushing", "high", [
            T("A bounce at each corner and a pry-bar check of links and bushings, vehicle safely supported when you go under it",
              "FTC also lists a loose shock. Look for a torn jounce bump, a loose mount nut, or a link with play.",
              "Mounts and links are tight and the clunk is gone over the same bump",
              "A loose shock mount, a click at a sway-bar link, or a torn bushing"),
        ], "Replace the worn mount, shock, link, or bushing, and torque to the manual (often at ride height for bushings)."),
        C("Loose exhaust (FTC also lists a loose exhaust pipe or muffler under clunk)", "medium", [
            T("Eyes and a gentle shake of the exhaust, when cool, at the hangers and flanges",
              "A failed hanger will clunk over bumps and may also rumble.",
              "The exhaust is secure on its hangers and does not bang on the floor",
              "A broken hanger or a loose flange"),
        ], "Replace the hanger or gasket and tighten the flange to the manual."),
    ],
))

add(dict(
    id="sus-weak-shocks",
    system="steering_suspension",
    title="Bouncy ride, or the vehicle keeps bobbing after a bump",
    symptom="The body keeps oscillating after a dip, or it leans a long time in a corner. FTC: bounce the vehicle up and down hard at each wheel and then let go — weak shocks will allow the vehicle to bounce twice or more. Worn shocks or improper tire inflation can also contribute to poor cornering.",
    keywords=["weak shocks", "bouncy", "worn struts", "bounce test"],
    tier="cited",
    sources=["ftc_basics", "nhtsa_tires"],
    safety=[],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Worn shock absorbers or struts", "high", [
            T("A bounce test at each corner, plus eyes on the shock body for a wet oil film",
              "Push down hard and let go. More than one rebound after you release is the FTC consumer test for weak shocks. A wet shock has already leaked.",
              "The vehicle settles after one rebound and the shock bodies are dry",
              "Two or more rebounds, or a wet shock body",
              SPEC_SHOCK_BOUNCE),
        ], "Replace the shocks or struts in axle pairs, with the mounts and hardware the vehicle uses. Recheck the bounce test."),
        C("Improper tire inflation (FTC also lists this under poor cornering)", "medium", [
            T("Accurate tire gauge, tires cold",
              "Set every tire to the door sticker.",
              "Pressures match the door sticker when cold",
              "Pressures were well off the sticker and the ride improves after they are set",
              SPEC_TIRE_COLD),
        ], "Maintain the door-sticker pressure and reassess the ride."),
    ],
))

add(dict(
    id="sus-uneven-tire-wear",
    system="steering_suspension",
    title="Uneven tire wear",
    symptom="The inner or outer edge is worn, or there is a sawtooth or cupped pattern. NHTSA: check tread monthly; replace at 2/32 inch or when wear bars are flush.",
    keywords=["tire wear", "inner edge", "cupping", "alignment wear"],
    tier="cited",
    sources=["nhtsa_tires", "ftc_basics"],
    safety=["A tire worn to 2/32 inch is not safe (NHTSA), especially in the wet."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Tread worn to the replacement limit", "high", [
            T("A tread-depth gauge or the NHTSA penny test, plus a look at the wear bars",
              "Place a penny in the tread with Lincoln's head upside down and facing you. If you can see the top of Lincoln's head, or the bars are flush, NHTSA says to replace the tire.",
              "Tread is above 2/32 inch and the wear bars are still below the tread",
              "Tread is at or below 2/32 inch, or the bars are flush",
              SPEC_TIRE_TREAD),
        ], "Replace the tire (and its mate when the manual or good practice requires it). Do not keep using a tire at the wear bars."),
        C("Incorrect pressure, a need for alignment or rotation, or a worn suspension part causing a cup or a feather", "high", [
            T("Cold pressures, a look at the wear pattern, and an inspection of shocks and joints",
              "An outer or inner edge often means pressure or alignment. Cupping often means a shock or a balance problem (NHTSA discusses balance and rotation).",
              "Pressure is at the door sticker, wear is even, and the shocks pass a bounce test",
              "A clear edge wear or a cup, with pressure that was wrong or a worn shock"),
        ], "Set pressure, replace worn suspension parts, then align and rotate on the schedule the owner's manual lists."),
    ],
))

add(dict(
    id="sus-vibration-speed",
    system="steering_suspension",
    title="Vibration that comes in at a particular road speed",
    symptom="A shake in the seat or the steering wheel that starts around a certain speed (often highway), and may ease if you slow down. FTC: an unbalanced or improperly balanced tire causes a vehicle to vibrate and may wear steering and suspension components prematurely.",
    keywords=["vibration at speed", "tire balance", "shake at 60"],
    tier="cited",
    sources=["ftc_basics", "nhtsa_tires"],
    safety=[],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Out-of-balance or out-of-round tire or wheel, or a lost wheel weight", "high", [
            T("Eyes on the inner and outer rim for a missing weight, a look at the tire for a lump or a broken belt, and a professional balance / road-force check if the visual is clean",
              "A missing weight or a bulge is enough to act. FTC's point is to balance tires properly.",
              "Weights are present, the tire has no bulge, and a balance brings the vibration down",
              "A missing weight, a bulge (replace the tire), or a wheel that will not balance"),
        ], "Rebalance or replace the damaged tire. Recheck at the speed that used to shake."),
        C("A bent wheel, a driveline vibration, or a dragging brake that is speed-related", "medium", [
            T("A comparison of coast versus light acceleration at the same speed, plus a wheel inspection",
              "A vibration that is the same on a coast and a light pull is more likely a wheel/tire. A load-related vibration may be a driveline (see those entries).",
              "The vibration was a balance issue and is now gone",
              "The vibration is load-related, or a wheel is visibly bent"),
        ], "Repair the bent wheel or go to the driveline or brake entries as the pattern indicates."),
    ],
))

add(dict(
    id="sus-tpms",
    system="steering_suspension",
    title="Tire-pressure (TPMS) warning is on",
    symptom="The low-tire lamp is on, or it flashed and then stayed on. NHTSA: TPMS warns only when a tire is significantly underinflated — you should still check pressures monthly when cold.",
    keywords=["TPMS", "tire pressure light", "low tire"],
    tier="cited",
    sources=["nhtsa_tires"],
    safety=["A significantly underinflated tire can fail. Check the pressures before a highway drive."],
    difficulty="easy",
    related_dtcs=["C0121"],
    causes=[
        C("One or more tires actually low, or a TPMS system fault (a flashing-then-steady lamp often means a system problem)", "high", [
            T("Accurate tire gauge, all four plus the spare if it is in the system, when cold",
              "NHTSA: check when the vehicle has not been driven for at least three hours. Compare with the door sticker, not the sidewall maximum. If every tire is at the sticker and the lamp still flashes or stays on, the system itself needs a diagnosis.",
              "Every monitored tire is at the door-sticker pressure and the lamp goes out after the system's relearn (if it has one)",
              "A tire is low (find the leak) or the pressures are good and the lamp still indicates a system fault",
              SPEC_TIRE_COLD),
        ], "Inflate to the door sticker and repair a leak. If the lamp indicates a system fault, follow the service-manual TPMS diagnostic (sensor, battery in the sensor, or a missing relearn)."),
    ],
))

add(dict(
    id="sus-blowout",
    system="steering_suspension",
    title="What to do in a tire blowout, and how to inspect afterward",
    symptom="A sudden loss of tire pressure while driving, a loud bang, and the vehicle pulling hard. NHTSA: hold the wheel with both hands, do not slam the brakes, gradually release the accelerator, steer to stabilize, then slow and pull off when it is safe.",
    keywords=["blowout", "flat at speed", "tire burst"],
    tier="cited",
    sources=["nhtsa_tires"],
    safety=["NHTSA: overreacting — including slamming the brakes — can cause a loss of control. Both hands on the wheel."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("A rapid loss of pressure from a puncture, a failed tire, or a previous underinflation", "high", [
            T("After you are stopped in a safe place: a visual of the failed tire, the wheel, and the other three, plus a cold-pressure check of the survivors",
              "Look for a sidewall failure, a broken belt, or wheel damage. NHTSA notes that a front blowout is felt more in the steering, a rear more in a wiggle, but the control steps are the same.",
              "The vehicle is off the road, the failed tire is not being driven on, and the other tires are at the door-sticker pressure",
              "The vehicle is still rolling on a destroyed tire, or another tire is also low"),
        ], "Replace or properly repair the tire (a sidewall failure is not a plug repair). Inspect the wheel. Check and set the other tires. Find why it failed if underinflation or overload was involved."),
    ],
))

add(dict(
    id="sus-death-wobble",
    system="steering_suspension",
    title="Shimmy or a violent steering wobble after a bump",
    symptom="On some trucks and solid-axle vehicles, a bump at speed starts a violent side-to-side shimmy that may only stop when you slow down hard.",
    means="This is often a combination of a worn track bar, a loose steering joint, a balance problem, and alignment — not a single magic part. Stop safely and inspect; do not keep 'powering through' it.",
    keywords=["death wobble", "shimmy after bump", "track bar"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=["A violent shimmy can take the vehicle out of your lane. Slow down smoothly, hold the wheel firmly, and get off the road."],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Worn track bar, tie rods, or a steering damper, often plus a tire issue", "high", [
            T("A thorough joint-and-track-bar play check, a damper inspection, and a tire balance / pressure check",
              "Watch the track-bar joints and every tie rod while a helper moves the wheel and while you rock the axle. Do not assume a new damper alone is the repair.",
              "Every joint is tight, pressures are at the sticker, and the shimmy is gone over the same bump at speed",
              "A track-bar joint with play, a worn tie rod, or a damper that is leaking and remains only a part of the cause"),
        ], "Replace worn joints first, set pressure and balance, then align. A damper is a helper, not the whole diagnosis."),
    ],
))

# ---------------------------------------------------------------------------
# HVAC
# ---------------------------------------------------------------------------
add(dict(
    id="hvac-no-heat",
    system="hvac",
    title="No cabin heat",
    symptom="The vents stay cool even after a long drive, or heat is weak only at idle.",
    means="The engine has to be warm, coolant has to flow through the heater core, and the blend door has to actually go to heat. A low coolant level often shows up as no heat before it shows as an overheat.",
    keywords=["no heat", "heater", "cold vents"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_COOL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Low coolant, air in the system, or a thermostat that never lets the engine get warm", "high", [
            fluid_level("Coolant", "When completely cool, check the reservoir and, if allowed, the radiator."),
            T("A scan of ECT and a comparison of both heater hoses once the engine should be warm",
              "Both hoses should be hot when heat is commanded and the engine is at temperature.",
              "ECT is in the normal range and both heater hoses are hot",
              "A low fill, a cold engine (stuck-open thermostat), or one heater hose that stays cold"),
        ], "Fill and bleed. Replace a stuck-open thermostat. Recheck the vents."),
        C("Blend door, a plugged heater core, or a mode door that never reaches the vents", "medium", [
            T("A listen for the blend-door actuator and a temperature check at the core tubes versus the vent",
              "If both heater hoses are hot and the vent stays cold, the blend door or the core is next.",
              "The actuator moves and the vent temperature follows the control",
              "A silent or rattling actuator, or hot tubes and a still-cold vent"),
        ], "Repair the actuator or the door, or flush/replace the heater core as the tests indicate."),
    ],
))

add(dict(
    id="hvac-no-ac",
    system="hvac",
    title="Air conditioning blows warm",
    symptom="The A/C is selected and the vents are not cold, or they are cold only sometimes.",
    means="A/C needs a working compressor clutch or electric compressor, a charge in the range the service manual allows, and airflow through the condenser. Pressures are vehicle- and temperature-specific — do not add refrigerant by guess.",
    keywords=["no ac", "ac warm", "air conditioning"],
    tier="generated-general",
    sources=[],
    safety=["Refrigerant can freeze skin and is a regulated substance. Do not open the system casually. Keep clear of the cooling fan."],
    difficulty="moderate",
    related_dtcs=["P0532"],
    causes=[
        C("Compressor not engaging, a failed fuse or relay, or a low or overcharged system", "high", [
            T("Eyes on the compressor clutch (if it has one) when A/C is requested, a fuse/relay check, and a set of gauges only if you are qualified, using the manual's pressure-to-temperature chart",
              "Confirm the clutch actually clicks in, or that an electric compressor is commanded. A sight glass, if fitted, is only a clue — use the manual.",
              "The compressor runs when commanded and the vent becomes clearly cold",
              "The clutch never engages, a fuse is dead, or a qualified pressure check is well outside the manual's chart",
              MANUAL),
        ], "Repair the fuse, relay, clutch, or command circuit. A charge or a leak repair belongs to a qualified A/C service that uses the specified refrigerant."),
        C("A packed condenser or a cooling fan that does not run with A/C", "medium", [
            T("A look at the condenser face and a check that the fan runs when A/C is requested",
              "A packed condenser or a dead fan will make vent temperature rise in traffic.",
              "The condenser is clear and the fan runs with A/C",
              "A packed core or a fan that never runs with A/C"),
        ], "Clean the condenser carefully and repair the fan circuit."),
    ],
))

add(dict(
    id="hvac-weak-airflow",
    system="hvac",
    title="Weak airflow from the vents",
    symptom="The blower is on a high setting and little air comes out, or air comes from the wrong outlets.",
    means="A cabin filter, a failed blower, a mode-door problem, or leaves in the intake can all starve the vents.",
    keywords=["weak airflow", "blower", "cabin filter"],
    tier="generated-general",
    sources=[],
    safety=[],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Plugged cabin filter or a failed blower motor / resistor / control module", "high", [
            T("A look at the cabin filter, plus a meter at the blower on a high setting",
              "A packed filter is the simple item. If the filter is clean and the blower does not run on any speed, check the fuse, the resistor or module, and power at the motor.",
              "The filter is serviceable and the blower runs on all speeds with a strong vent flow",
              "A packed filter, a blower that only works on high (classic resistor failure), or no power at the motor"),
        ], "Replace the cabin filter. Repair the resistor, module, or motor as the speed-test indicates."),
    ],
))

add(dict(
    id="hvac-musty",
    system="hvac",
    title="Musty smell from the vents",
    symptom="A locker-room or moldy smell when you turn the blower or the A/C on, sometimes with fogged glass.",
    means="The evaporator and the drain stay wet. A blocked drain can also put water on the passenger floor (see that entry).",
    keywords=["musty ac", "mold smell", "vent smell"],
    tier="generated-general",
    sources=[],
    safety=["Do not pour random chemicals into the intake. Use a method the service manual or a reputable HVAC cleaner allows."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("A blocked evaporator drain, or microbial growth on the evaporator", "high", [
            T("Eyes at the evaporator drain under the cowl or the passenger floor, and a look at the cabin filter",
              "With A/C running, a healthy drain should drip outside. A soaked filter or a dry drain plus a wet carpet is a blocked drain.",
              "The drain drips outside, the carpet is dry, and the filter is clean",
              "No drip, a wet passenger floor, or a filthy filter"),
        ], "Clear the drain. Replace the cabin filter. Clean the evaporator only with an approved method. Recheck the smell after a long A/C run."),
    ],
))

add(dict(
    id="hvac-ac-only-speed",
    system="hvac",
    title="A/C cold only at speed, warm in traffic",
    symptom="The vents are cold on the highway and go warm in stop-and-go traffic.",
    means="The condenser is not getting enough air at idle: a failed fan, a packed condenser, or a system that is low enough to struggle without ram air.",
    keywords=["ac only at speed", "warm in traffic"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Cooling fan not running with A/C, or a packed condenser", "high", [
            T("A watch of the fan at a hot idle with A/C on, and a look at the condenser face",
              "The fan should run, often at a higher speed, when A/C is requested.",
              "The fan runs and the vents stay cold at a long idle",
              "The fan is still and the vents warm up in traffic, or the condenser is packed"),
        ], "Repair the fan circuit and clean the condenser. If it is still warm at idle, a qualified charge check is next."),
    ],
))

add(dict(
    id="hvac-one-side",
    system="hvac",
    title="Heat or A/C only on one side of the cabin",
    symptom="The driver vents and the passenger vents disagree — one is hot, the other is cold — on a system that is supposed to be even, or on a dual-zone system that will not follow the controls.",
    means="A blend-door actuator, a broken door, or a calibration is more likely than a 'half-failed' compressor.",
    keywords=["one side heat", "dual zone", "blend door"],
    tier="generated-general",
    sources=[],
    safety=[],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Failed blend-door actuator or a door off its shaft", "high", [
            T("A listen and a scan-tool actuator command if available, plus a temperature comparison at the left and right vents",
              "Command full heat and full cold on each zone and listen for a clicking actuator.",
              "Each side follows the control and the actuators are quiet",
              "A clicking actuator, or one side that never changes"),
        ], "Replace the actuator or repair the door, and run the manual's calibration if it has one."),
    ],
))

add(dict(
    id="hvac-water-floor",
    system="hvac",
    title="Water on the passenger floor",
    symptom="The passenger carpet is wet, sometimes with a musty smell, and the rest of the floor is dry.",
    means="A blocked A/C evaporator drain is the usual cause. A heater-core leak is different — that wetness is sticky and sweet (coolant). Do not confuse the two.",
    keywords=["wet passenger floor", "evaporator drain", "water in car"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_COOL],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Blocked evaporator drain (plain water) versus a heater-core leak (sweet coolant)", "high", [
            T("A paper towel, your nose, and a look at the drain",
              "Plain water from a drain is not sweet and will not be sticky like coolant. Coolant is sweet and may be colored. FTC also notes that a puddle of clear water under the vehicle can be normal A/C condensation — the drain should send it outside, not onto the floor.",
              "The drain drips outside and the carpet stays dry after an A/C drive",
              "The carpet is wet with plain water and the drain is dry outside, or the wetness is sweet and sticky"),
        ], "Clear the drain for plain water. If the wetness is coolant, go to the heater-core leak path and do not just dry the carpet."),
    ],
))

add(dict(
    id="hvac-clear-puddle",
    system="hvac",
    title="Clear-water puddle under the vehicle after A/C use",
    symptom="A puddle of clear water under the passenger side or the center after the air conditioner has been running. FTC: a puddle of clear water usually is no problem — it may be normal condensation from the air conditioner.",
    keywords=["clear puddle", "ac condensation", "water under car"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Normal A/C condensate, or a drain that is dripping in an unexpected place", "high", [
            T("Eyes on the color and a check of other fluid levels",
              "Confirm the puddle is clear water, not green, orange, red, or oily (see the leak-by-color entries). Confirm it appears only after A/C use.",
              "It is clear water after A/C use, and no reservoir is falling",
              "The puddle is colored or oily, or a coolant or oil level is falling"),
        ], "If it is clear condensate, no repair is needed. If it is any other fluid, follow the matching leak entry."),
    ],
))

print("after hvac", len(ENTRIES))

# ---------------------------------------------------------------------------
# Exhaust / emissions
# ---------------------------------------------------------------------------
add(dict(
    id="exh-mil-steady",
    system="exhaust_emissions",
    title="Check-engine light is on steadily",
    symptom="The check-engine or service-engine-soon lamp comes on and stays on while you drive. EPA: there is no cause for panic, but the OBD system has detected a problem that can waste fuel, shorten engine life, or increase emissions — have it diagnosed soon. Check the gas cap first.",
    keywords=["check engine", "MIL on", "service engine soon", "gas cap"],
    tier="cited",
    sources=["epa_obd"],
    safety=["A steady lamp is not usually an immediate stop, but do not ignore it. If the lamp later starts blinking, see the flashing-MIL entry and reduce driving."],
    difficulty="easy",
    related_dtcs=["P0420", "P0442", "P0171", "P0300"],
    causes=[
        C("Loose or missing gas cap, or another stored emissions fault", "high", [
            T("A hand on the cap, then a scan tool",
              "EPA: when you reach your destination, make sure the cap is not loose or missing, and always shut the engine off when you refuel. If the light does not go out after a few short trips following a cap tightening or replacement, have the vehicle serviced. Then read the codes — do not guess.",
              "The cap clicks and seals, and the lamp goes out after the trips EPA describes, or a scan shows a different confirmed fault you can test",
              "The cap is already tight and a code remains — use that code's tests in this app"),
        ], "Tighten or replace the cap first. Then diagnose the stored code with the code-specific guidance in this app. EPA notes that a modern shop should connect a scan tool and download the stored information."),
    ],
))

add(dict(
    id="exh-rotten-eggs",
    system="exhaust_emissions",
    title="Rotten-egg or burning-sulphur smell",
    symptom="A continuous sulphur or rotten-egg odor, often worse under load. FTC: this usually indicates a problem in the catalytic converter or other emission-control devices — do not delay diagnosis.",
    keywords=["rotten eggs", "sulphur", "catalytic converter smell"],
    tier="cited",
    sources=["ftc_basics", "epa_obd"],
    safety=[SAFE_EXHAUST, "A severely overheated converter can start a fire in dry grass. If the smell comes with a glowing converter or a flashing MIL, stop in a safe place."],
    difficulty="moderate",
    related_dtcs=["P0420", "P0430", "P0172"],
    causes=[
        C("A rich condition overheating the converter, or a failing converter", "high", [
            scan_codes("A rich, misfire, or catalyst-efficiency code is the starting point."),
            T("A look at the converter for a dent, a rattle, or an extreme heat color, plus fuel-trim and O2-sensor data",
              "A converter that is being fed raw fuel (a misfire or a rich condition) will stink and can be ruined. FTC says not to delay this diagnosis.",
              "Trims are normal, there is no misfire, and the converter is intact and not glowing",
              "A flashing MIL, a rich trim, a rattle in the converter, or a glowing brick"),
        ], "Fix the rich or misfire cause first. A damaged converter is then a replacement, with the oxygen-sensor tests that go with a P0420-family code."),
    ],
))

add(dict(
    id="exh-leak-sound",
    system="exhaust_emissions",
    title="Exhaust leak — tick, blow, or a louder-than-normal exhaust",
    symptom="A tick at a manifold when cold, a blow at a flange, or a generally louder exhaust. You may smell exhaust in the cabin.",
    means="FTC: a loud rumbling under the vehicle indicates a need for a new muffler or exhaust pipe. An exhaust leak at the front can also confuse oxygen sensors and set a catalyst or fuel-trim code. Exhaust in the cabin is a carbon-monoxide risk.",
    keywords=["exhaust leak", "manifold tick", "loud muffler"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_EXHAUST, "If you smell exhaust in the cabin, do not keep driving with the windows up. Carbon monoxide is dangerous."],
    difficulty="moderate",
    related_dtcs=["P0420", "P0171"],
    causes=[
        C("A leaking manifold gasket, a failed flange, or a rusted pipe or muffler", "high", [
            T("Eyes and a careful listen when the exhaust is cold enough to get near, plus a look at hangers and at soot stains",
              "A black soot streak at a joint is a leak. FTC also lists a defective pipe, converter, or muffler under a rumble.",
              "The system is tight, hangers are intact, and there is no soot at a joint",
              "A soot stain, a rust hole, a broken hanger, or a tick at the manifold that you can feel as a pulse of gas (carefully, not with a bare hand on a hot pipe)"),
        ], "Replace the gasket, pipe, muffler, or hanger. Torque manifold fasteners in the manual's sequence, often on a cold engine."),
    ],
))

add(dict(
    id="exh-failed-emissions",
    system="exhaust_emissions",
    title="Failed an emissions or inspection test",
    symptom="A state or local inspection failed for OBD readiness, a stored code, a high tailpipe reading, or a visual (gas cap, MIL not working).",
    means="On 1996-and-newer vehicles, EPA's OBD system is the usual inspection path. A not-ready monitor after a battery disconnect is different from a failed catalyst or a stored code.",
    keywords=["failed emissions", "OBD inspection", "not ready", "smog"],
    tier="cited",
    sources=["epa_obd"],
    safety=[SAFE_EXHAUST],
    difficulty="moderate",
    related_dtcs=["P0420", "P0442", "P0171"],
    causes=[
        C("A stored or pending emissions code, or monitors that are not yet ready", "high", [
            scan_codes("Also read I/M readiness. A recent battery disconnect can leave monitors not ready until a drive cycle the manual or the inspection station describes is completed."),
            T("A confirmation that the MIL works (key on, lamp comes on, then goes out if no fault) as EPA describes",
              "EPA: the lamp should flash briefly at key-on. A lamp that never lights, or that stays on, will fail many inspections.",
              "The MIL works, no codes are stored, and readiness is complete or within what the inspection program allows",
              "A stored code, a MIL that does not work, or too many not-ready monitors"),
        ], "Repair the stored code with its tests in this app. Then complete the drive cycle the service manual or the inspection program lists. Do not disconnect the battery just before a test."),
    ],
))

add(dict(
    id="exh-catalyst-rattle",
    system="exhaust_emissions",
    title="Rattle from the catalytic converter or a plugged converter",
    symptom="A rattle under the floor that changes with rpm, or a loss of power and a very hot converter with little exhaust flow at the tailpipe.",
    means="A broken catalyst brick rattles. A melted brick from a misfire or a rich condition will plug the exhaust and can overheat.",
    keywords=["catalyst rattle", "plugged converter", "no exhaust flow"],
    tier="generated-general",
    sources=["ftc_basics", "epa_obd"],
    safety=[SAFE_EXHAUST, "A plugged or glowing converter is a fire and engine-damage risk. Do not keep loading the engine."],
    difficulty="advanced",
    related_dtcs=["P0420", "P0430", "P0300"],
    causes=[
        C("Broken or melted catalyst, often after a misfire or a rich condition", "high", [
            T("A cool-engine hand-rock of the converter (when it is fully cool), a tailpipe-flow comparison, and a scan for misfire or rich codes",
              "A rattle from inside the shell is a broken brick. A poorly flowing, overheating converter with a history of a flashing MIL is often melted.",
              "The converter is quiet when cold-rapped gently, and the engine has normal power",
              "A brick rattle, or a severe power loss and a glowing or badly discolored converter"),
        ], "Replace the converter after you repair the misfire or rich cause that killed it. A new converter will fail again if the misfire remains."),
    ],
))

add(dict(
    id="exh-evap-code",
    system="exhaust_emissions",
    title="EVAP leak or a purge/vent fault (gas-cap and evaporative codes)",
    symptom="A P0440/P0442/P0455-family code, sometimes with a fuel smell, sometimes with no smell at all.",
    means="EPA specifically calls out a loose or missing gas cap as a cause of a lamp and wasted fuel. After the cap, look at EVAP hoses, the canister, and the purge and vent valves — with a smoke test if you have one, never with flame.",
    keywords=["EVAP", "P0442", "P0455", "purge valve"],
    tier="cited",
    sources=["epa_obd", "ftc_basics"],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=["P0440", "P0442", "P0455", "P0449"],
    causes=[
        C("Loose cap, a cracked EVAP hose, or a failed purge or vent valve", "high", [
            T("A cap check, a visual of every EVAP hose at the tank and the engine, and a scan-tool purge/vent functional test or a smoke test the manual allows",
              "Tighten or replace the cap first. Then command the valves and look for a hose that has split at a clamp.",
              "The cap seals, the hoses are intact, and the valves open and close when commanded",
              "A damaged cap, a split hose, or a valve that is stuck open or closed"),
        ], "Replace the cap, hose, or valve the test names. Complete the drive cycle so the monitor can run."),
    ],
))

add(dict(
    id="exh-o2-lazy",
    system="exhaust_emissions",
    title="Oxygen or air-fuel sensor problem (lazy or stuck sensor)",
    symptom="A fuel-trim or O2/AF-sensor code, poor economy, or a catalyst code after a sensor has been slow to switch.",
    means="A sensor can be the cause, or it can be telling the truth about an exhaust leak or a rich/lean engine. Prove the exhaust and the fueling before you replace every sensor.",
    keywords=["oxygen sensor", "O2 sensor", "air fuel sensor", "lazy O2"],
    tier="generated-general",
    sources=["epa_obd"],
    safety=[SAFE_EXHAUST],
    difficulty="moderate",
    related_dtcs=["P0131", "P0133", "P0135", "P0155"],
    causes=[
        C("A failed sensor heater or a poisoned, lazy sensor", "medium", [
            T("Scan tool heater current or resistance per the manual, and a look at switching rate at a warm cruise",
              "A heater code is usually the heater or its wiring. A lazy signal at cruise, with a tight exhaust and normal fueling, is often the sensor.",
              "The heater is in the manual's range and the sensor switches or tracks as the manual describes",
              "An open heater, or a flat line after the engine and exhaust have been proven",
              MANUAL),
        ], "Replace only the sensor the test failed, with the correct type, and repair any exhaust leak first."),
        C("An exhaust leak or a fueling problem that is confusing a good sensor", "high", [
            T("A look for soot at the manifold and a fuel-trim check before the sensor is condemned",
              "A leak upstream of the sensor lets air in and can look lean. A misfire can look rich at the converter.",
              "The exhaust is tight and trims are modest, and the sensor still fails its test",
              "A leak or a fueling problem that, once repaired, makes a new sensor unnecessary"),
        ], "Repair the leak or the fueling problem, then reevaluate the sensor."),
    ],
))

add(dict(
    id="exh-muffler-rumble",
    system="exhaust_emissions",
    title="Low rumble from a failed muffler or pipe",
    symptom="A low-pitched rhythmic rumble under the vehicle, louder than before, often with a rusted muffler. FTC: a rumble can be a defective exhaust pipe, converter, or muffler (or a worn U-joint — confirm the source).",
    keywords=["muffler", "rumble", "loud exhaust"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_EXHAUST],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Rusted muffler or pipe, versus a driveline rumble", "high", [
            T("A listen under the vehicle (cool exhaust) versus a listen at a U-joint, and a look for a rust hole or a loose baffle",
              "FTC lists both a defective exhaust and a worn U-joint under rumble. An exhaust rumble is there in Neutral at rpm; a U-joint rumble is more with road speed in gear.",
              "The exhaust is intact and the rumble was coming from somewhere else, or the rumble is clearly a hole in the muffler you can see",
              "A rust hole, a rattling baffle, or a rumble that is actually a U-joint (see the driveline entries)"),
        ], "Replace the muffler or pipe, or go to the U-joint path if that is the source. Use new gaskets and the correct hangers."),
    ],
))

# ---------------------------------------------------------------------------
# Leaks by fluid color (dedicated browse group; some overlap is intentional)
# ---------------------------------------------------------------------------
add(dict(
    id="leak-coolant-color",
    system="leaks",
    title="Yellowish green, pastel blue, or fluorescent orange watery leak",
    symptom="A colored watery puddle or crust, usually toward the front. FTC: those colors indicate an overheated engine or an antifreeze leak from a bad hose, water pump, or leaking radiator.",
    keywords=["coolant puddle", "green leak", "orange leak", "antifreeze"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_COOL, "Antifreeze is toxic to pets."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Hose, radiator, water pump, or a heater hose", "high", [
            visual_leak("at the radiator, every hose, the water-pump weep, and the heater hoses — engine cold"),
            T("A cooling-system pressure test on a cold system, at the cap rating the manual lists",
              "Find the wet joint under the rated pressure.",
              "The system holds and is dry",
              "A drip appears under pressure",
              MANUAL),
        ], "Replace the failed part, fill with the specified coolant, and bleed. See also the cooling entries if the engine already overheated."),
    ],
))

add(dict(
    id="leak-engine-oil",
    system="leaks",
    title="Dark brown or black oily leak — engine oil",
    symptom="A dark oily puddle or film, usually mid-engine. FTC: a dark brown or black oily fluid means the engine is leaking oil, possibly from a bad seal or gasket.",
    keywords=["oil leak", "black puddle", "valve cover", "oil pan"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_JACK, SAFE_RUNNING, "Oil on an exhaust can smoke and is a fire risk."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Valve-cover, oil-pan, filter, or a crankshaft seal", "high", [
            visual_leak("at the valve covers, the filter and cooler lines, the pan, and the front and rear of the crank (a rear main often films the bellhousing)"),
            fluid_level("Engine oil", "On level ground, with the engine off as the manual describes, read the dipstick."),
        ], "Repair the gasket, filter, or seal that is actually wet. Recheck the level. A rear main is a larger job — confirm it is not just a valve-cover trail running back."),
    ],
))

add(dict(
    id="leak-red-oily",
    system="leaks",
    title="Red oily leak — transmission or power steering",
    symptom="A red oily spot. FTC: this indicates a transmission or power-steering fluid leak. Trace which reservoir is falling.",
    keywords=["red puddle", "ATF leak", "power steering red"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Transmission cooler line or pan, or a power-steering hose or pump", "high", [
            visual_leak("at both systems after you wipe them, so a fresh wet spot tells you which one"),
            fluid_level("Both transmission and power-steering fluid", "Check each the way its manual describes."),
        ], "Repair the system whose level is falling. Use each system's specified fluid."),
    ],
))

add(dict(
    id="leak-clear-water",
    system="leaks",
    title="Clear-water puddle — often A/C condensate",
    symptom="A puddle of clear water, often after using the air conditioner. FTC: this usually is no problem; it may be normal condensation from the air conditioner.",
    keywords=["clear water puddle", "condensation"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Normal A/C condensate, versus a fluid you mistook for water", "high", [
            T("Eyes on color and oiliness, and a check of coolant, oil, and washer levels",
              "Confirm it is not pale coolant or a leaking washer bottle (washer fluid is often blue and soapy).",
              "It is clear water after A/C use",
              "Any color, oiliness, or a falling coolant or washer level"),
        ], "No repair for normal condensate. Follow the matching leak entry if it is not water."),
    ],
))

add(dict(
    id="leak-fuel-wet",
    system="leaks",
    title="Fuel leak — wet gasoline or diesel, and a raw-fuel smell",
    symptom="A wet fuel line, a drip under the tank, or a puddle that smells like fuel. FTC: a persistent gasoline odor is a potentially dangerous fuel-system leak.",
    keywords=["fuel leak", "gasoline puddle", "diesel leak"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_FUEL, "Do not start the engine or use a jump starter until the leak is repaired."],
    difficulty="moderate",
    related_dtcs=["P0455"],
    causes=[
        C("A leaking line, filter, rail, or tank", "high", [
            visual_leak("along the rail, filter, and tank — engine off, no jump starters or lights that can spark nearby"),
        ], "Repair the leaking part. Confirm the smell is gone before a first start."),
    ],
))

add(dict(
    id="leak-brake-fluid-color",
    system="leaks",
    title="Brake-fluid leak — pale, slippery, paint-stripping wetness",
    symptom="A pale slippery wet spot at a wheel or under the master cylinder, or a falling brake reservoir.",
    means="Brake fluid is not dark like oil and not usually bright red like ATF. It damages paint and is a safety leak.",
    keywords=["brake fluid color", "pale leak at wheel"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Hose, caliper, line, or master-cylinder leak", "high", [
            visual_leak("at each wheel and at the master / booster"),
        ], "Repair the failed part, fill with the specified DOT fluid, and bleed. Confirm a firm pedal."),
    ],
))

add(dict(
    id="leak-gear-oil-color",
    system="leaks",
    title="Thick brown gear-oil leak at an axle or a transfer case",
    symptom="A thick brown or dark oily leak at a pumpkin, an axle end, or a transfer case, sometimes with a hypoid or sulphur smell.",
    means="Gear oil is typically thicker than engine oil and is not bright red. A low axle fill will ruin the gears and can soak a brake.",
    keywords=["gear oil", "axle leak color", "hypoid"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_JACK, SAFE_BRAKE],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Axle, pinion, or transfer-case seal", "high", [
            visual_leak("at the cover, pinion, axle ends, and transfer-case seals"),
            T("A fill-plug level check", "Confirm the level and type.", "The level is at the fill the manual lists", "A low fill or a wet seal", MANUAL),
        ], "Replace the seal, service a soaked brake, and refill with the specified lubricant."),
    ],
))

add(dict(
    id="leak-washer-fluid",
    system="leaks",
    title="Washer-fluid leak (often blue or green and soapy)",
    symptom="A colored, soapy, watery leak at a fender or under the cowl, and a washer bottle that empties itself.",
    means="This is not coolant if the engine level holds and the liquid is soapy and comes from the washer bottle or a hose in the fender.",
    keywords=["washer fluid leak", "blue watery leak"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Cracked washer bottle, a split hose, or a leaking pump", "high", [
            visual_leak("at the washer bottle, the pump spigots, and the hoses in the fenders"),
        ], "Replace the bottle, pump, or hose. Confirm it is not coolant by checking the cooling-system level."),
    ],
))

print("after leaks", len(ENTRIES))

# ---------------------------------------------------------------------------
# Noises / vibrations (FTC sound families plus location/speed)
# ---------------------------------------------------------------------------
add(dict(
    id="nv-squeal-belt",
    system="noises_vibrations",
    title="Squeal that follows engine speed — belt",
    symptom="A shrill, sharp noise that follows engine speed, often at start or when a load hits the accessories. FTC: a squeal is usually a loose or worn power-steering, fan, or air-conditioning belt.",
    keywords=["squeal", "belt noise", "engine speed squeal"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Loose or worn accessory belt, or a weak tensioner", "high", [
            T("Eyes on the belt and tensioner, engine off, plus a careful listen as a helper switches A/C or steers (clear of the fan)",
              "FTC's examples are the power-steering, fan, or A/C belt. Look for glaze, cracks, and a tensioner at the end of its travel.",
              "The belt is in good condition and the tensioner is in its mid-range, and the squeal is gone",
              "A glazed belt, a weak tensioner, or a squeal that appears exactly when a particular accessory loads"),
        ], "Replace the belt and a weak tensioner. Repair a seized pulley before a new belt is ruined."),
    ],
))

add(dict(
    id="nv-click-ftc",
    system="noises_vibrations",
    title="Click related to engine speed or vehicle speed",
    symptom="A slight sharp click. FTC: it can be a loose wheel cover, a loose or bent fan blade, a stuck valve lifter, or low engine oil — and it may follow engine speed or vehicle speed. Decide which by whether it happens in Neutral at rpm, or only when rolling.",
    keywords=["click", "wheel cover", "lifter", "fan blade"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING, SAFE_JACK],
    difficulty="moderate",
    related_dtcs=["C0035"],
    causes=[
        C("Loose wheel cover or a stone (vehicle-speed click)", "high", [
            T("A stop in a safe place and a check of each cover, lug, and tire tread",
              "If the click stops in Neutral at rpm and starts again when rolling, start here (FTC: loose wheel cover).",
              "Covers and lugs are tight and the tread is clear",
              "A loose cover, a loose lug, or a stone in the tread"),
        ], "Secure or replace the cover, torque the lugs, or remove the stone."),
        C("Loose or bent fan blade (engine-speed click)", "medium", [
            T("Eyes on the fan, engine off and cool, for a cracked blade or a loose bolt",
              "A bent blade can click and can also come apart. Do not run the engine with a cracked fan.",
              "The fan is tight and every blade is intact",
              "A cracked, loose, or bent blade"),
        ], "Replace a damaged fan and its bolts, using the specified hardware."),
        C("Low oil or a sticking hydraulic lifter (engine-speed tick/click)", "medium", [
            fluid_level("Engine oil", "Check the dipstick with the engine off as the manual describes."),
            T("A listen at the valve cover versus the lower end, at idle and a slightly raised rpm",
              "FTC lists a stuck valve lifter or low oil. A light tick that eases as oil pressure rises can be a lifter; confirm the level first.",
              "The oil is at the mark and the tick is gone after a proper fill and a short run",
              "A low fill, or a tick that remains with a correct level and may need a valvetrain inspection"),
        ], "Correct the oil level and grade. A remaining lifter tick is diagnosed with the service-manual valvetrain procedure."),
    ],
))

add(dict(
    id="nv-screech-brakes",
    system="noises_vibrations",
    title="Screech while the vehicle is in motion — brake wear indicators",
    symptom="A high-pitched, piercing metallic sound, usually while moving, often when lightly braking. FTC: this is often the brake wear indicators telling you it is time for maintenance.",
    keywords=["screech", "wear indicator"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Brake wear tabs or metal-to-metal linings", "high", [
            T("A wheel-off lining-thickness measurement",
              "See the brake-squeal entry for the full inspection.",
              "Linings are above the manual's minimum",
              "The wear tab is touching, or the lining is at the minimum",
              MANUAL),
        ], "Replace the linings and inspect the rotors. Do not silence a wear tab and keep driving."),
    ],
))

add(dict(
    id="nv-rumble-location",
    system="noises_vibrations",
    title="Rumble — decide whether it is exhaust or driveline",
    symptom="A low-pitched rhythmic rumble. FTC: a defective exhaust pipe, converter, or muffler, or a worn universal joint or other drive-line component. Use location and whether it happens in Neutral to tell them apart.",
    keywords=["rumble", "exhaust rumble", "driveline rumble"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_EXHAUST, SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Exhaust rumble versus a U-joint or wheel rumble", "high", [
            T("A Neutral rpm test versus a road-speed test, plus a cool visual of the exhaust and the U-joints",
              "A rumble that you can raise and lower in Park or Neutral with the throttle is usually exhaust. A rumble that only appears with road speed is more often a U-joint, a wheel, or a tire.",
              "You can name the source: a rusted muffler, a worn U-joint, or a tire/wheel, and the other family is quiet",
              "The source is still mixed — inspect both, starting with the pattern above"),
        ], "Repair the exhaust or the driveline part that the pattern named. See the matching detailed entries."),
    ],
))

add(dict(
    id="nv-ping",
    system="noises_vibrations",
    title="Ping under load (location: engine, related to rpm and load)",
    symptom="A high-pitched metallic tapping on a grade or on acceleration, related to engine speed. FTC: usually lower-octane fuel than recommended; if it persists, ignition timing could be at fault. Use the owner's manual for the correct octane.",
    keywords=["ping", "knock under load", "octane"],
    tier="cited",
    sources=["ftc_basics"],
    safety=["Ease off if it knocks hard. Persistent knock can damage pistons."],
    difficulty="easy",
    related_dtcs=["P0325"],
    causes=[
        C("Incorrect octane or a timing / knock-control problem", "high", [
            T("The owner's-manual octane, then a tank of that grade, then a scan of knock and timing PIDs if it remains",
              "This is the same family as the ping/spark-knock misfire entry — start with fuel grade (FTC).",
              "The ping is gone on the specified grade",
              "It remains on the specified grade — go to the spark-knock entry for timing and sensor tests"),
        ], "Use the specified octane. If it remains, follow the ping entry's timing and knock-sensor tests."),
    ],
))

add(dict(
    id="nv-heavy-knock-location",
    system="noises_vibrations",
    title="Heavy knock — lower engine or a loose torque converter",
    symptom="A rhythmic pounding, related to engine speed, from the crankcase or the bellhousing. FTC: worn crankshaft or connecting-rod bearings, or a loose transmission torque converter.",
    keywords=["heavy knock", "rod knock location", "torque converter knock"],
    tier="cited",
    sources=["ftc_basics"],
    safety=["Check oil pressure. Avoid high rpm until you know which it is."],
    difficulty="advanced",
    related_dtcs=["P0521"],
    causes=[
        C("Bearing knock versus loose converter bolts", "high", [
            T("A mechanical oil-pressure gauge, a stethoscope at the oil pan versus the bellhousing, and a converter-bolt inspection as the manual allows",
              "A deep, load-related pound at the pan with low pressure is a bearing risk. A knock at the bellhousing that is also listed by FTC can be a loose converter.",
              "Oil pressure is in the manual's range and the converter bolts are tight, and the pound is gone",
              "Low pressure with a crankcase pound, or loose converter bolts",
              MANUAL),
        ], "Follow the heavy-knock engine entry or tighten/replace converter bolts to the manual. Do not 'just add oil' to a bearing knock."),
    ],
))

add(dict(
    id="nv-clunk-location",
    system="noises_vibrations",
    title="Clunk — suspension versus exhaust versus driveline",
    symptom="A random thump. FTC: a loose shock or other suspension component, or a loose exhaust pipe or muffler. A driveline can also clunk on engagement — use when it happens to decide.",
    keywords=["clunk", "location", "shock", "exhaust clunk"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_JACK],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("A bump-related suspension or exhaust clunk, versus a D-to-R driveline clunk", "high", [
            T("Reproduce it: over a bump (suspension or exhaust) versus a shift from Drive to Reverse while stopped (driveline)",
              "Then inspect the family you just named — shocks and links, exhaust hangers, or U-joints (FTC's lists).",
              "The clunk is assigned to one family and that part is then proven tight or repaired",
              "You still have both patterns — inspect all three families"),
        ], "Repair the loose shock, hanger, or U-joint the test pointed at. See the detailed clunk entries in those systems."),
    ],
))

add(dict(
    id="nv-vibe-50-70",
    system="noises_vibrations",
    title="Vibration at a steady 50–70 mph (or a similar highway speed)",
    symptom="A shake that appears in a highway-speed band and often eases if you slow down. It may be in the seat, the floor, or the steering wheel.",
    means="This is a classic tire-balance or tire-construction speed, but a driveshaft or a slight brake drag can live here too. FTC emphasizes proper tire balance.",
    keywords=["vibration 60 mph", "highway shake", "50-70"],
    tier="cited",
    sources=["ftc_basics", "nhtsa_tires"],
    safety=[],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Tire or wheel balance, or a damaged tire", "high", [
            T("A look for a missing weight or a bulge, then a professional balance if the visual is clean",
              "Note whether the shake is in the steering (more often front) or the seat (more often rear).",
              "A balance or a tire replacement removes the shake in that speed band",
              "The tires are balanced and the shake remains — go to a driveline or brake check at the same speed"),
        ], "Balance or replace the damaged tire. Recheck in the same speed band."),
    ],
))

add(dict(
    id="nv-vibe-accel-only",
    system="noises_vibrations",
    title="Vibration only on acceleration",
    symptom="The vehicle is smooth on a coast and shudders when you put a load on the engine, in a straight line.",
    means="Load-related vibrations are more often an inner CV or tripod joint, a failing engine or transmission mount, or a torque-converter shudder than a simple tire balance.",
    keywords=["vibration on accel", "load vibration"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[],
    difficulty="moderate",
    related_dtcs=["P0741"],
    causes=[
        C("Inner CV, a broken mount, or a converter shudder", "high", [
            T("A comparison of a light-load cruise lock-up (converter) versus a first-gear or second-gear acceleration (axle or mount), plus eyes on the mounts and inner boots",
              "A rumble-strip feel at a light cruise is often TCC (see that entry). A first-gear hop or a torn inner boot is an axle or a mount.",
              "You can name the family: a torn inner boot, a broken mount, or a shudder only when lock-up applies",
              "The pattern is still mixed — inspect all three"),
        ], "Repair the mount, the axle, or the converter-clutch fluid/converter as the pattern indicates."),
    ],
))

add(dict(
    id="nv-ps-moan",
    system="noises_vibrations",
    title="Power-steering groan or moan at full lock or at idle",
    symptom="A moan from the pump when you park-steer or when the fluid is low, sometimes with a foamy reservoir.",
    means="Low fluid, a hose that sucks air, or a pump that is starting to fail will moan. Holding the wheel at full lock will also make a healthy pump complain — do not do that for long.",
    keywords=["power steering groan", "PS moan", "foamy PS"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Low or aerated fluid, or a failing pump", "high", [
            fluid_level("Power-steering fluid", "Check the mark the cap describes, engine off."),
            visual_leak("at the pump, hoses, and gear"),
        ], "Repair the leak, fill with the specified fluid, and bleed as the manual describes. A remaining groan at normal steering angles may be a pump."),
    ],
))

add(dict(
    id="nv-heat-shield",
    system="noises_vibrations",
    title="Heat-shield rattle",
    symptom="A tinny rattle under the floor, often at a particular rpm or right after start-up, that you can sometimes quiet with a careful (cool) hand on a loose shield.",
    means="A rusted heat-shield clip is common and is not a failed converter, but confirm you are not ignoring a loose catalyst brick.",
    keywords=["heat shield", "tin rattle", "underbody rattle"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_EXHAUST, "Only touch a shield when it is fully cool."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("A loose or rusted-out heat shield, versus a rattling catalyst brick", "high", [
            T("A cool-engine underbody inspection",
              "A shield that moves on a rusted weld is the usual find. A rattle from inside the converter shell is the catalyst (see that entry).",
              "The shield is secure, or a rattle you can clearly assign to a shield",
              "The rattle is inside the converter"),
        ], "Secure or replace the shield with hardware that can survive heat. If the brick is loose, follow the catalyst-rattle entry."),
    ],
))

add(dict(
    id="nv-valve-tick",
    system="noises_vibrations",
    title="Light tick at the valve cover, related to engine speed",
    symptom="A light, fast tick at the top of the engine that follows rpm and may ease as the engine warms and oil pressure rises.",
    means="FTC lists a stuck valve lifter or low oil under a click related to engine speed. Confirm the oil level and grade first. A tick that is actually an exhaust-manifold leak is often louder when cold and may have a soot stain.",
    keywords=["valve tick", "lifter tick", "top end tick"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Low oil, a dirty or stuck lifter, or a ticking exhaust-manifold leak", "high", [
            fluid_level("Engine oil", "Check it first, every time."),
            T("A stethoscope at the valve cover versus the manifold, cold and warm",
              "A manifold leak often ticks loudest when cold and may show soot. A lifter tick lives under the cover and may change with oil pressure.",
              "The oil is at the mark and the tick is clearly assigned and then repaired",
              "A low fill, a remaining top-end tick, or a soot-stained manifold joint"),
        ], "Correct the oil. Repair a manifold leak. A remaining lifter tick is a service-manual valvetrain job — do not invent a lash specification."),
    ],
))

add(dict(
    id="nv-chain-rattle-cold",
    system="noises_vibrations",
    title="Timing-chain rattle on cold start",
    symptom="A short rattle from the front of the engine for a few seconds after a cold start, then it may quiet.",
    means="A worn tensioner or a stretched chain often talks first on a cold start when oil pressure is still coming up. Do not ignore it on an interference engine.",
    keywords=["chain rattle", "cold start rattle", "tensioner"],
    tier="generated-general",
    sources=[],
    safety=["On an interference engine, a failed chain can bend valves. Diagnose sooner rather than later."],
    difficulty="advanced",
    related_dtcs=["P0016"],
    causes=[
        C("Worn chain, guides, or a tensioner that is slow to pump up", "high", [
            T("A cold-start listen at the front cover, a scan for correlation codes, and an oil-condition and oil-grade check",
              "Very dirty or the wrong oil can make a tensioner lazy. A correlation code plus a rattle is more urgent.",
              "The engine is quiet on a cold start with the specified oil, and there is no correlation code",
              "A repeated cold-start rattle, especially with a correlation code"),
        ], "Service the oil if it was wrong, then repair the chain, guides, and tensioner as the manual groups them."),
    ],
))

add(dict(
    id="nv-brake-groan",
    system="noises_vibrations",
    title="Brake groan at a stop, or a bump when you release the pedal",
    symptom="A low groan as you come to a stop, or a clunk as you lift off the brake, sometimes on a slight grade.",
    means="Pad hardware, a rust ridge on a rotor, or a caliper that does not slide freely can groan. It is different from a wear-tab screech.",
    keywords=["brake groan", "stop groan", "release clunk"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Rusty slides, missing clips, or a rust ridge on the rotor", "high", [
            T("A wheel-off inspection of the hardware and the rotor edge",
              "Pads should move freely in the bracket and the clips should be present.",
              "The hardware is complete, the slides are free, and the groan is gone",
              "Seized slides, missing clips, or a heavy rust ridge"),
        ], "Service or replace the hardware and rotors as needed, and use only a lubricant the brake manual allows on the slides — not on the lining."),
    ],
))

# ---------------------------------------------------------------------------
# Smells (FTC)
# ---------------------------------------------------------------------------
add(dict(
    id="sml-burnt-toast",
    system="smells",
    title="Burnt-toast or burning-insulation smell",
    symptom="A light, sharp odor like burnt toast. FTC: this often signals an electrical short and burning insulation. To be safe, try not to drive the vehicle until the problem is diagnosed.",
    keywords=["burnt toast", "burning insulation", "electrical smell"],
    tier="cited",
    sources=["ftc_basics"],
    safety=["FTC: try not to drive until this is diagnosed. An electrical fire can start in the dash or a harness. Disconnect the battery if you see smoke and it is safe to do so."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("A shorted wire, a failing motor (blower, wiper, or a stuck relay), or a burning connector", "high", [
            T("A careful sniff-and-look, engine off, at the fuse box, under the dash, and at recently added accessories, plus a look for a browned connector or a fuse that has been replaced repeatedly",
              "FTC's point is electrical. Look for a melted connector, a motor that is hot to a careful approach, or an aftermarket tap.",
              "No browned plastic, no hot motor, and the smell is gone after a failed part is found and repaired",
              "A melted connector, a hot motor, or a repeated fuse — do not keep running that circuit"),
        ], "Repair the shorted harness or replace the failed motor or relay. Never bypass a fuse. See also the repeated-fuse entry."),
    ],
))

add(dict(
    id="sml-rotten-eggs",
    system="smells",
    title="Rotten-egg smell (sulphur)",
    symptom="A continuous burning-sulphur odor. FTC: this usually indicates a problem in the catalytic converter or other emission-control devices. Don't delay diagnosis and repair.",
    keywords=["rotten egg smell", "sulphur smell"],
    tier="cited",
    sources=["ftc_basics", "epa_obd"],
    safety=[SAFE_EXHAUST],
    difficulty="moderate",
    related_dtcs=["P0420", "P0172"],
    causes=[
        C("Converter or a rich / misfire condition feeding it", "high", [
            scan_codes("Then follow the rotten-egg exhaust entry."),
        ], "Diagnose the rich or misfire cause and the converter as in the exhaust-system entry. Do not delay (FTC)."),
    ],
))

add(dict(
    id="sml-burning-oil",
    system="smells",
    title="Thick acrid odor — burning oil",
    symptom="A thick, acrid smell. FTC: this usually means burning oil — look for a leak. You may also see smoke from the exhaust manifold or a catalytic-converter area.",
    keywords=["burning oil smell", "acrid oil"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_RUNNING, "Oil on a hot exhaust is a fire risk. If you see smoke at the manifold, stop in a safe place."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("An oil leak dripping on a hot exhaust, or oil burning inside the engine", "high", [
            visual_leak("at the valve covers, the turbo if equipped, and along the exhaust"),
            T("A look at the tailpipe for blue-gray smoke (see smoke-color entries) versus a leak that only smokes under the hood",
              "FTC says to look for a leak. Blue tailpipe smoke is a different, internal path.",
              "You can name the path: a wet leak on the exhaust, or blue tailpipe smoke from burning oil inside",
              "A wet leak on the manifold, or blue exhaust after warm-up"),
        ], "Repair the leak, or follow the oil-consumption and blue-smoke entries if it is internal."),
    ],
))

add(dict(
    id="sml-gasoline",
    system="smells",
    title="Gasoline-vapor smell after a failed start, or a smell that will not go away",
    symptom="FTC: gasoline vapors after a failed start may mean a flooded engine — wait a few minutes and try again. If the odor persists, a fuel leak is possible and needs immediate attention.",
    keywords=["gasoline smell", "fuel vapor"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_FUEL],
    difficulty="easy",
    related_dtcs=["P0455"],
    causes=[
        C("A flooded start versus a real leak", "high", [
            T("A wait-and-look, then a leak search if the smell remains (FTC's sequence)",
              "No wet leak and a smell that fades after a wait points at a flood. A smell that stays, or a wet line, is a leak.",
              "The smell fades after a wait and a proper restart, with no wet fuel",
              "The smell persists or you find wet fuel — stop cranking"),
        ], "Follow the flooded-start entry or repair the leak. Do not keep cranking a wet leak."),
    ],
))

add(dict(
    id="sml-brakes-clutch",
    system="smells",
    title="Burning-resin or acrid chemical smell — brakes or clutch",
    symptom="FTC: this odor may signal overheated brakes or clutch. Check the parking brake. Stop. Allow the brakes to cool after repeated hard braking on mountain roads. Light smoke from a wheel means a stuck brake — tow the vehicle.",
    keywords=["burning brakes smell", "clutch smell", "resin smell"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_BRAKE, "FTC: stop and let the brakes cool. Tow a smoking wheel."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Overheated or stuck brakes, a held parking brake, or a slipping clutch", "high", [
            T("A check of the parking-brake control, a careful look at each wheel for smoke or a much-hotter wheel, and a clutch slip check if the odor is mid-vehicle on a manual",
              "FTC's order: check the parking brake, stop, let them cool. A wheel that is smoking is a stuck brake. A mid-vehicle smell on a climbing manual is often a clutch.",
              "The parking brake is fully off, no wheel is smoking, and the clutch is not slipping",
              "A held parking brake, a smoking wheel, or a slipping clutch — follow those entries and do not keep driving a smoking brake"),
        ], "Release and adjust the parking brake, or follow the stuck-brake or slipping-clutch entries. Tow if a wheel is smoking."),
    ],
))

add(dict(
    id="sml-sweet-coolant",
    system="smells",
    title="Sweet, steamy odor — coolant",
    symptom="FTC: a sweet, steamy odor indicates a coolant leak. If the gauge does not show overheating, drive carefully to the nearest service station, watching the gauges. If the odor comes with a hot metallic scent and steam from under the hood, the engine has overheated — pull over immediately and have the vehicle towed.",
    keywords=["sweet smell", "coolant smell", "steam smell"],
    tier="cited",
    sources=["ftc_basics"],
    safety=[SAFE_COOL, "Follow FTC's split: no steam and a normal gauge — go carefully and watch the gauge. Steam and a hot metallic scent — stop and tow."],
    difficulty="moderate",
    related_dtcs=["P0128"],
    causes=[
        C("A coolant leak that may or may not have already overheated the engine", "high", [
            T("A look at the gauge (or lamp) and at the hood line for steam, only from outside the vehicle if it is already hot",
              "FTC's two-path advice is the first decision. When the engine is fully cool, then inspect for the leak.",
              "The gauge is normal, there is no steam, and you can get to a place to inspect a leak when it is cool",
              "Steam and a hot metallic scent — stop, tow, and do not open the cap"),
        ], "If it has not overheated, find the leak when cool (cooling and leak-color entries). If it has, tow and follow the overheat-with-steam entry."),
    ],
))

add(dict(
    id="sml-exhaust-in-cabin",
    system="smells",
    title="Exhaust smell in the cabin",
    symptom="You smell exhaust inside the vehicle, sometimes only at idle or only with the vents on recirculate.",
    means="An exhaust leak under the floor, a leaking manifold, or a missing cabin seal can put carbon monoxide in the cabin. This is not a 'freshener' problem.",
    keywords=["exhaust in cabin", "carbon monoxide", "fumes in car"],
    tier="generated-general",
    sources=["ftc_basics"],
    safety=["Carbon monoxide is dangerous. Get fresh air, get out of a closed garage, and do not keep driving with the windows up. Have the leak found."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("An exhaust leak under the cabin, or a leaking exhaust-manifold / EGR path", "high", [
            T("A cool-engine inspection of the manifold, the underfloor pipes, and the trunk or hatch seals, plus a listen for a tick or a blow",
              "A soot stain under the seat area or at a manifold is a strong clue.",
              "The exhaust is tight and the smell is gone with the same vent settings",
              "A leak under the floor or at the manifold, or a missing seal that lets underbody air in"),
        ], "Repair the exhaust leak or the seal. Recheck with the windows closed only after the repair, in a safe, ventilated setting."),
    ],
))

print("after smells", len(ENTRIES))

# ---------------------------------------------------------------------------
# Smoke color — Oregon DEQ / PA DEP (TCEQ 2002) facts, original wording
# ---------------------------------------------------------------------------
add(dict(
    id="smk-white-gas",
    system="smoke",
    title="White exhaust smoke after warm-up — gasoline engine",
    symptom="A white or gray-white exhaust that continues after the engine is warm, often with a sweet smell. Oregon DEQ and Pennsylvania DEP consumer guidance: on a gasoline engine, white smoke after warm-up points to coolant entering the combustion chamber (head gasket, cracked head or block). Thin white vapor on a cold morning is usually water vapor, not smoke.",
    keywords=["white smoke", "coolant exhaust", "head gasket smoke"],
    tier="cited",
    sources=["oregon_smoke", "pa_dep_smoke", "ftc_basics"],
    safety=[SAFE_COOL, SAFE_EXHAUST, "Do not keep driving a vehicle that is putting coolant out the tailpipe — it can ruin the engine."],
    difficulty="advanced",
    related_dtcs=["P0301"],
    causes=[
        C("Normal cold-start water vapor, versus coolant being burned", "high", [
            T("A watch of the exhaust after a full warm-up, plus a look at the coolant level and the oil",
              "Oregon DEQ notes that water vapor from condensation is commonly mistaken for smoke in winter and is not considered smoke. Persistent white exhaust after warm-up, especially if it is sweet, is not vapor.",
              "The white cloud disappears after warm-up and the coolant and oil are clean",
              "White exhaust continues after warm-up, the coolant level falls, or the oil is milky"),
        ], "If it is only cold vapor, no repair. If it persists, do a combustion-in-coolant or leak-down test and treat it as a head-gasket or cracked-head path."),
        C("Failed head gasket, cracked head, or cracked block (the cause list in the state smoking-vehicle tables)", "high", [
            T("A chemical block test, a compression or leak-down test, and a coolant-level watch — engine cool when you open the system",
              "State consumer tables list a bad head gasket or a cracked head or block as the usual gasoline white-smoke causes.",
              "A block test is negative and compression is even — look again at whether it was only vapor",
              "A positive block test, a low cylinder, or a falling coolant level with no external leak",
              MANUAL),
        ], "This is a head-gasket or head/block repair. Do not keep topping up and driving."),
    ],
))

add(dict(
    id="smk-blue-gas",
    system="smoke",
    title="Blue exhaust smoke — gasoline engine (burning oil)",
    symptom="Blue or blue-gray smoke, often on deceleration or right after an idle, sometimes with fouled plugs or oil use. Oregon DEQ and Pennsylvania DEP: blue smoke on a gasoline engine means engine oil is being burned — worn rings, valves, or cylinders, a damaged head gasket, or oil on a hot exhaust.",
    keywords=["blue smoke", "burning oil exhaust"],
    tier="cited",
    sources=["oregon_smoke", "pa_dep_smoke", "ftc_basics"],
    safety=[SAFE_EXHAUST],
    difficulty="advanced",
    related_dtcs=["P0430"],
    causes=[
        C("Oil leaking into the combustion chamber, or oil dripping on the exhaust", "high", [
            visual_leak("at the valve covers and turbo (if equipped) to see whether oil is hitting the exhaust"),
            T("A compression or leak-down test, and a watch of when the smoke appears (accel vs decel vs after idle)",
              "Smoke on deceleration often points at valve guides; a constant blue plus high oil use often points at rings. The state tables also list a damaged head gasket.",
              "There is no blue smoke after a leak on the exhaust is repaired, or leak-down is in the manual's range and the smoke was only an external leak burning off",
              "Leak-down is high, or blue smoke continues with a dry exhaust manifold",
              MANUAL),
        ], "Repair an external leak first. Internal oil burning is a mechanical repair (guides, rings, turbo, or a gasket) — not a thicker-oil 'fix' as a diagnosis."),
    ],
))

add(dict(
    id="smk-black-gas",
    system="smoke",
    title="Black or gray exhaust smoke — gasoline engine (incomplete combustion)",
    symptom="Black or sooty gray smoke, often with a fuel smell, a rich code, or a dirty air filter. Oregon DEQ and Pennsylvania DEP: on a gasoline engine this is incomplete fuel combustion — a clogged air filter, a fuel-system or emission-system malfunction, ignition timing off, or low compression.",
    keywords=["black smoke", "rich exhaust", "soot"],
    tier="cited",
    sources=["oregon_smoke", "pa_dep_smoke"],
    safety=[SAFE_EXHAUST, SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=["P0172", "P0300"],
    causes=[
        C("Restricted air filter, a rich fueling problem, or an ignition / compression issue", "high", [
            T("Eyes on the air filter, a scan of fuel trims and codes, and a plug inspection",
              "The state tables put a clogged air filter first for a reason. Then look at injectors, a stuck purge, or timing, as in the rich-fuel entry.",
              "The filter is serviceable and trims are not rich, and the smoke is gone",
              "A packed filter, a rich trim, or sooty plugs"),
        ], "Replace a packed filter. Then follow the rich-condition and ignition entries. Low compression is a mechanical test per the manual."),
    ],
))

add(dict(
    id="smk-white-diesel",
    system="smoke",
    title="White exhaust smoke — diesel engine",
    symptom="White smoke from a diesel, especially when cold, or a persistent white smoke after warm-up. Oregon DEQ and Pennsylvania DEP: on a diesel, white smoke is often an improper air/fuel mixture — faulty injection, incorrect injection or valve timing, overheating, or a faulty lift or injection pump. (Cold white smoke can also be delayed ignition from weak glow plugs.)",
    keywords=["diesel white smoke", "diesel hard start smoke"],
    tier="cited",
    sources=["oregon_smoke", "pa_dep_smoke"],
    safety=[SAFE_FUEL, SAFE_EXHAUST, "Do not crack high-pressure diesel lines."],
    difficulty="advanced",
    related_dtcs=["P0380"],
    causes=[
        C("Glow-plug or a cold-start aid problem, versus an injection-timing or pump problem after warm-up", "high", [
            T("A glow-plug system test when cold, and a watch of whether the smoke remains after the engine is fully warm",
              "White smoke that is only on a cold start and then clears may be glow plugs or a slow start. White smoke that stays after warm-up is more the injection or timing family in the state tables.",
              "The engine starts reasonably, glow plugs test in the manual's range, and the smoke is gone when warm",
              "A dead glow system, or white smoke that continues after warm-up",
              MANUAL),
        ], "Repair the glow system for a cold-only problem. A remaining warm white smoke is an injection-system diagnosis per the service manual."),
    ],
))

add(dict(
    id="smk-blue-diesel",
    system="smoke",
    title="Blue exhaust smoke — diesel engine (burning oil)",
    symptom="Blue diesel exhaust, often with rising oil use. Oregon DEQ and Pennsylvania DEP: blue smoke on a diesel means engine oil is being burned — excess oil, or worn rings, valves, or cylinders.",
    keywords=["diesel blue smoke", "diesel burning oil"],
    tier="cited",
    sources=["oregon_smoke", "pa_dep_smoke"],
    safety=[SAFE_EXHAUST],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Overfilled crankcase, worn rings or valves, or a turbo-oil leak into the intake", "high", [
            fluid_level("Engine oil", "An overfill will push oil past rings or into the intake. The state tables list excess oil first."),
            T("A look at the turbo inlet and the intercooler pipe for oil, plus a compression or leak-down test",
              "A failed turbo seal can push oil into the intake on a diesel and smoke blue.",
              "The oil level is correct and the turbo inlet is reasonably clean, and compression is in the manual's range",
              "An overfill, a turbo dumping oil into the intake, or low compression",
              MANUAL),
        ], "Correct an overfill. Repair a turbo seal or the mechanical wear the tests name."),
    ],
))

add(dict(
    id="smk-black-diesel",
    system="smoke",
    title="Black or gray exhaust smoke — diesel engine",
    symptom="A diesel puffing black or sooty gray smoke under load, or at idle. Oregon DEQ and Pennsylvania DEP: incomplete combustion — a damaged or clogged air filter, a faulty injection system, the wrong grade of fuel, incorrect injection-pump timing, overheating, or low compression.",
    keywords=["diesel black smoke", "diesel soot"],
    tier="cited",
    sources=["oregon_smoke", "pa_dep_smoke"],
    safety=[SAFE_EXHAUST, SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Restricted air (filter or a clogged intake), or an injection / timing / fuel-grade problem", "high", [
            T("Eyes on the air filter and the intake, a check of the fuel you last added, and a scan or the manual's injection tests if the air path is clear",
              "The state tables start with a damaged or clogged air filter. The wrong fuel grade is also on the list.",
              "The air path is clear, the fuel is the correct grade, and the smoke is gone under the same load",
              "A packed filter, the wrong fuel, or smoke that remains with a clear air path — injection timing or a pump test is next, per the manual"),
        ], "Replace a packed filter. If the fuel was wrong, have the tank serviced. Remaining smoke is an injection or compression diagnosis — do not 'turn up the pump' as a repair."),
    ],
))

add(dict(
    id="smk-condensation-vs-smoke",
    system="smoke",
    title="Is it smoke, or is it winter water vapor?",
    symptom="A white cloud at the tailpipe on a cold day that may look alarming. Oregon DEQ: water vapor from condensation is commonly mistaken for vehicle smoke in winter and is not considered vehicle smoke; it is normal.",
    keywords=["condensation", "steam from exhaust", "winter vapor"],
    tier="cited",
    sources=["oregon_smoke", "pa_dep_smoke"],
    safety=[SAFE_EXHAUST],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("Normal water vapor versus a true white-smoke problem", "high", [
            T("A watch of the cloud after the engine and the exhaust have fully warmed, on a drive long enough to heat the muffler",
              "Vapor shrinks and disappears as the system warms and is usually odorless. A sweet or oily smell, a falling coolant level, or a cloud that will not go away is not simple vapor.",
              "The cloud is gone after a full warm-up and the coolant and oil are stable",
              "The cloud remains after a full warm-up, or it is sweet or oily — go to the white- or blue-smoke entries"),
        ], "No repair for normal vapor. If it persists, follow the matching smoke-color entry."),
    ],
))

# ---------------------------------------------------------------------------
# Body / SRS
# ---------------------------------------------------------------------------
add(dict(
    id="srs-airbag-lamp",
    system="body_srs",
    title="Airbag or SRS warning lamp is on",
    symptom="The airbag, SRS, or restraint lamp stays on after a key-on bulb check, or it flashes a pattern.",
    means="The system has stored a fault and may not deploy a bag or a pretensioner correctly. This is not a driveway probing job. A scan of the SRS module, not the engine module, is the starting point.",
    keywords=["airbag light", "SRS", "restraint lamp"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_SRS, "Do not probe yellow connectors with a test light. Do not use a battery charger or a jump pack on a vehicle with the ignition on and the SRS un-disabled."],
    difficulty="professional",
    related_dtcs=["B0001", "B0010"],
    causes=[
        C("A stored SRS fault (clock spring, a connector after a seat was moved, or a pretensioner)", "high", [
            T("An SRS-capable scan tool, and a visual of yellow connectors under a seat or at the wheel only after the service-manual disable procedure",
              "Read the SRS codes first. A seat that was recently unbolted, or a new steering wheel, is a common loose-connector cause.",
              "The lamp does a normal bulb check and goes out, and no SRS codes are stored",
              "A stored SRS code, or a connector that was left loose after seat work"),
        ], "Follow the service-manual disable, diagnosis, and enable procedure. A clock-spring or pretensioner replacement is a qualified-restraint job. Recheck the lamp after a complete cycle."),
    ],
))

add(dict(
    id="srs-after-crash",
    system="body_srs",
    title="After a crash — bags or pretensioners have deployed",
    symptom="A bag has gone off, a seat-belt pretensioner has fired, or the vehicle has been in a collision even if a bag did not deploy.",
    means="Deployed restraints and their inflators are single-use. The vehicle may also have a damaged wiring clock spring, a bent seat structure, or a module that must be replaced or reset only as the maker allows. This is not a 'stuff the bag back in' repair.",
    keywords=["deployed airbag", "after crash", "pretensioner"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_SRS, "A undeployed, damaged inflator is dangerous. Leave crash-damaged restraints to a qualified shop. Dispose of inflators only as the law and the manual require."],
    difficulty="professional",
    related_dtcs=["B0001"],
    causes=[
        C("Deployed or damaged restraint components that must be replaced as a set", "high", [
            T("A professional inspection against the service-manual replacement list after a collision (bags, pretensioners, module, brackets, and sometimes the wiring)",
              "Do not guess which parts can be reused. Many makers require a module replacement or a documented reset after a deployment.",
              "A qualified shop has replaced every part the manual lists for this collision type, and the SRS lamp is out",
              "A deployed bag that was 'tucked back,' or a lamp that is still on after a partial repair"),
        ], "Have the complete, manual-listed set replaced. Do not drive with an open SRS lamp after a crash as if the system were whole."),
    ],
))

add(dict(
    id="srs-clock-spring",
    system="body_srs",
    title="Horn, cruise, or steering-wheel controls dead, sometimes with an SRS lamp",
    symptom="The horn, the airbag lamp, and sometimes the steering-wheel buttons or the clock fail together after the wheel has been turned a lot, or after a wheel-off job.",
    means="The clock spring (coil spring under the wheel) carries the bag and the horn. If it is broken, the bag circuit is open. This is an SRS part, not a simple horn relay until the lamp is explained.",
    keywords=["clock spring", "horn not working", "steering wheel buttons"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_SRS],
    difficulty="professional",
    related_dtcs=["B0010"],
    causes=[
        C("An open clock spring, or a connector at the wheel that was not seated", "high", [
            T("An SRS scan and the service-manual clock-spring continuity procedure, only after disable",
              "Do not just 'test the horn relay' and ignore an SRS lamp.",
              "The lamp is out and the horn and wheel buttons work through a full left-and-right turn of the wheel",
              "The lamp or the horn drops out as you turn the wheel — a classic clock-spring pattern"),
        ], "Replace the clock spring using the manual's centering and disable/enable steps. Recheck the lamp and the horn through a full steering sweep."),
    ],
))

add(dict(
    id="srs-seatbelt",
    system="body_srs",
    title="Seat-belt warning or a pretensioner fault",
    symptom="A belt warning will not go out, a belt will not retract, or an SRS lamp is stored against a pretensioner or a buckle switch.",
    means="A buckle switch and a pretensioner are part of the restraint system. A belt that will not retract may be a simple guide, or it may be a fired pretensioner after a crash.",
    keywords=["seat belt", "pretensioner", "belt warning"],
    tier="generated-general",
    sources=[],
    safety=[SAFE_SRS, "A fired pretensioner is a one-use part. Do not probe it."],
    difficulty="professional",
    related_dtcs=["B0010"],
    causes=[
        C("A failed buckle switch, a jammed retractor, or a fired pretensioner", "high", [
            T("An SRS scan and a mechanical look at the belt path (twists, a jammed trim, or a locked retractor)",
              "A belt that is locked after a crash is often a fired pretensioner. A warning lamp with no crash may be a buckle switch.",
              "The belt retracts, the buckle switch changes state, and the lamp is out",
              "A stored pretensioner or buckle code, or a retractor that is locked after a deployment"),
        ], "Replace a fired pretensioner as an SRS part. Repair a buckle switch or a twisted belt path if that is all it is."),
    ],
))

add(dict(
    id="body-power-window",
    system="body_srs",
    title="Power window or door-lock problem",
    symptom="One window is dead, is slow, or will not go up; or a door lock does not follow the switch.",
    means="A single door is usually that door's switch, motor, or a broken regulator cable. All doors at once is more a fuse, a body module, or a battery/ground problem.",
    keywords=["power window", "door lock", "regulator"],
    tier="generated-general",
    sources=[],
    safety=["Keep hands clear of a window that may drop. Support a glass if you remove a door panel."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Failed motor or regulator, or a fuse / switch / ground that feeds several doors", "high", [
            T("A fuse check, a test of the switch at that door versus the master, and a meter at the motor connector if the panel can be opened safely",
              "If the other doors work, focus on that door. If none work, start at the fuse, the battery, and the body-control power.",
              "The glass moves on a known-good command and the regulator is quiet",
              "Power and ground at the motor and no movement (failed motor or a broken regulator), or no power at any door"),
        ], "Replace the motor or regulator, or repair the shared fuse and ground. Recheck auto-up features that may need a relearn."),
    ],
))

add(dict(
    id="body-wiper",
    system="body_srs",
    title="Wipers inoperative, or they will not park",
    symptom="The wipers do not move, move only on one speed, or do not return to the parked position.",
    means="A blown fuse, a failed wiper motor or park switch, a seized linkage, or a failed stalk or module can all look the same until you test power at the motor.",
    keywords=["wipers", "wiper motor", "won't park"],
    tier="generated-general",
    sources=[],
    safety=["Do not reach into the linkage with the ignition on. Wipers can start without warning."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Fuse, motor, linkage, or a park-switch failure", "high", [
            T("A fuse check, a look at the linkage with the motor unplugged, and a meter at the motor on a commanded sweep",
              "A seized pivot will burn a motor. A motor that runs but never parks is often the park switch inside the motor.",
              "The wipers sweep and park, and the linkage is free",
              "A dead fuse, a seized linkage, no power at the motor, or a motor that will not park"),
        ], "Free or replace the linkage, then replace a burned motor. Recheck park. Use only the fuse rating the manual lists."),
    ],
))

# ---------------------------------------------------------------------------
# Powersports: 2-stroke / 4-stroke small engine
# ---------------------------------------------------------------------------
add(dict(
    id="ps-2s-no-start",
    system="powersports_engine",
    title="Two-stroke engine will not start",
    symptom="A motorcycle, ATV, sled, or small two-stroke cranks or kicks and will not fire, or it only pops.",
    means="A two-stroke needs spark, a fuel-and-oil mix, air, and a sealed crankcase. A dry scored piston from running without oil is a different, mechanical problem — do not keep pulling it over.",
    keywords=["two stroke", "2-stroke", "no start sled", "no start dirt bike"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=True,
    tier="generated-general",
    sources=[],
    safety=[SAFE_2STROKE, SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("No spark (see also the CDI/stator entries)", "high", [
            T("A proper spark tester on the plug cap, with the kill switch in run and the cap on a grounded tester — not a screwdriver in your hand",
              "Confirm the plug is dry and the kill switch and tether (if any) are in run.",
              "A crisp spark at the tester, with the switch in run",
              "No spark — go to the CDI/stator no-spark entry and the pinout workflow if this machine has a profile in the app"),
        ], "Repair the ignition path, then retry. Do not keep flooding the engine."),
        C("No fuel at the crankcase, a plugged passage, or the wrong / stale mix", "high", [
            T("A look at the fuel, the petcock or pump, and a brief, careful check that the carburetor is actually delivering fuel (the carb entries)",
              "Stale mix, a closed petcock, or a plugged screen will leave a dry plug (or a flooded, raw-fuel plug if the float is stuck).",
              "Fresh mix of the ratio the owner's manual lists reaches the carb, and the plug shows a wet-but-reasonable color after a few kicks",
              "No fuel at the carb, or a fouled or flooded plug with old fuel"),
        ], "Drain stale fuel, mix to the manual's ratio, and follow the carburetor entries. Do not guess a premix ratio."),
        C("No compression or a seized / scored piston", "medium", [
            T("A compression gauge with the manual's adapter, or a careful feeling of whether the engine will pull through a full stroke",
              "A seized engine will not turn freely. A worn or holed piston will kick over too easily and will not start.",
              "The engine turns through with normal resistance and compression is in the manual's range",
              "It is locked, or compression is far below the manual — stop kicking it",
              MANUAL),
        ], "A seized or scored two-stroke is a top-end job. Find why it was lean or run without oil before you rebuild."),
    ],
))

add(dict(
    id="ps-2s-seized",
    system="powersports_engine",
    title="Two-stroke seized or run without oil",
    symptom="The engine locked while running or on a kick, often after a tank of forgotten oil, a failed oil pump (oil-injected engines), or a lean jetting on a hot day.",
    means="A two-stroke piston can seize in seconds without lubrication or when it is very lean. Forcing it around can break a rod.",
    keywords=["two stroke seize", "no mix", "scored piston"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_2STROKE],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("A seized piston from no oil, a failed oil injector, or a lean condition", "high", [
            T("A careful attempt to turn the engine the manual's way, then a top-end inspection if it is locked or feels notchy",
              "On oil-injected engines, check whether the pump cable and the tank actually had oil. On premix engines, confirm what was in the last tank.",
              "The engine turns freely and the bore is not scored",
              "It is locked or the piston is dry-scored"),
        ], "Do a top-end inspection. Repair the oil pump or the jetting/premix cause so a new piston is not seized on the first ride."),
    ],
))

add(dict(
    id="ps-2s-weak",
    system="powersports_engine",
    title="Two-stroke is weak, fouls plugs, or will not clear out",
    symptom="The engine runs, but it is flat, four-strokes in the mid-range, or the plug is wet and black after a short ride.",
    means="A rich jet, a failing reed, a restricted exhaust (a packed silencer or a melted pipe), or a weak spark will all feel 'flat.' Read the plug and the exhaust before you go bigger on the main jet.",
    keywords=["two stroke weak", "fouled plug", "four stroking"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=True,
    tier="generated-general",
    sources=[],
    safety=[SAFE_2STROKE, SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Rich jetting or a fouled plug, versus a packed exhaust or a weak spark", "high", [
            T("A plug reading after a ride, a spark test, and a look into the silencer or the pipe for packed packing or a melt",
              "A wet black plug with a crisp spark is often rich or a rich oil mix. A weak spark needs the CDI path. A packed silencer will also make it four-stroke and run hot.",
              "The plug color is in the range the manual or a reputable jetting guide for this engine describes, spark is crisp, and the exhaust is open",
              "A wet fouled plug, a packed silencer, or a weak spark"),
        ], "Service the exhaust packing, repair the ignition, or correct jetting and the oil ratio as the tests indicate — using the manual, not a guessed jet size."),
    ],
))

add(dict(
    id="ps-4s-no-start",
    system="powersports_engine",
    title="Four-stroke small engine or powersports engine will not start",
    symptom="A four-stroke motorcycle, ATV, or small engine kicks or cranks and will not fire.",
    means="Same three needs as a car — spark, fuel, compression — plus a valve-clearance and a cam-chain condition that you do not ignore on these engines.",
    keywords=["four stroke no start", "ATV no start", "dirt bike 4-stroke"],
    audience=["powersports"],
    cdi_workflow=True,
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("No spark, no fuel, or a valve/cam problem that has killed compression", "high", [
            T("A spark tester, a look at fuel delivery, and a compression test plus a valve-clearance check per the manual",
              "A four-stroke with tight valves or a jumped cam chain can have almost no compression and will not start.",
              "Spark is present, fuel is present, compression is in the manual's range, and valve clearance is in the manual's range",
              "A missing one of those four, or a cam chain that is slack or jumped",
              MANUAL),
        ], "Repair the missing item. Set valve clearance to the service manual before you assume a top-end is worn out."),
    ],
))

add(dict(
    id="ps-4s-valve-clatter",
    system="powersports_engine",
    title="Four-stroke valve clatter or a skipped cam chain",
    symptom="A top-end clatter, a ticking that is louder than a normal valvetrain, or a sudden no-start after a noisy run.",
    means="Many powersports four-strokes need periodic valve-clearance inspections. A slack cam chain can jump and bend valves on an interference engine.",
    keywords=["valve clearance", "cam chain", "tappet noise"],
    audience=["powersports"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=["If you suspect a jumped cam chain, stop running the engine and check timing marks."],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Valve clearance out of specification, or a worn cam-chain tensioner", "high", [
            T("A feeler-gauge valve-clearance check and a timing-mark / chain-slack inspection, all per the service manual",
              "Do not invent a clearance. Use the manual's cold or hot procedure as written.",
              "Clearance and chain tension are in the manual's range, and the marks line up",
              "A tight or very loose valve, or marks that do not line up",
              MANUAL),
        ], "Adjust the valves or replace the chain, guides, and tensioner as the manual groups them. Check for bent valves if the chain already jumped."),
    ],
))

add(dict(
    id="ps-low-compression",
    system="powersports_engine",
    title="Low compression on a small engine or powersports engine",
    symptom="The engine kicks or cranks too easily, starts hard, and has little power. A gauge reads below the manual's minimum.",
    means="Rings, a valve that is not seating, a head-gasket leak, or (on a two-stroke) a leaking crankshaft seal can all drop compression. The crankcase of a two-stroke has to seal for the engine to run.",
    keywords=["low compression", "kicks over too easy"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Worn rings, a valve that is not seating, or a two-stroke crankcase-seal leak", "high", [
            T("A compression or leak-down test, and on a two-stroke a crankcase-pressure or a seal inspection if the manual has one",
              "A two-stroke that has spark and fuel but will not run, and that has a wet crankcase seal, may be losing its pumping.",
              "Compression is in the manual's range and, on a two-stroke, the crankcase seals as the manual describes",
              "A low reading, or a two-stroke seal that is wet with fuel or oil",
              MANUAL),
        ], "Repair the rings, the valves, the gasket, or the crankcase seals as the test indicates."),
    ],
))

add(dict(
    id="ps-overheat-small",
    system="powersports_engine",
    title="Powersports engine overheating",
    symptom="A temperature lamp, a boiling coolant tank on a liquid-cooled bike or sled, or a two-stroke that has gone lean and is getting hot.",
    means="Liquid-cooled machines still need a fan, a clean radiator, and a correct cap. Air-cooled machines need clean fins and a correct oil level. A lean two-stroke will overheat in a hurry.",
    keywords=["atv overheat", "motorcycle overheat", "sled overheat"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_COOL, SAFE_2STROKE],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Low coolant, a packed radiator or fins, a failed fan, or a lean two-stroke condition", "high", [
            fluid_level("Coolant or oil, as this machine uses", "When cool, check the tank or the oil the way the owner's manual shows."),
            T("Eyes on the radiator or the cooling fins, and a check that the fan (if equipped) actually runs",
              "Mud-packed radiators are a common ATV cause. A two-stroke that is running very lean will also overheat — look at the plug and the exhaust.",
              "The level is correct, the core or fins are clean, and the fan runs when it should",
              "A low fill, a packed radiator, a dead fan, or a white, very lean plug on a two-stroke"),
        ], "Clean the core, repair the fan, and fill the system. Correct a lean two-stroke before you ride it hard again."),
    ],
))

add(dict(
    id="ps-reed-valve",
    system="powersports_engine",
    title="Two-stroke reed-valve problem",
    symptom="A two-stroke that is hard to start, back-fires through the carb, or is flat at low rpm, sometimes after a piece of a reed has been eaten.",
    means="The reeds are one-way valves into the crankcase. A chipped reed will ruin the pumping and can go through the top end.",
    keywords=["reed valve", "reeds", "two stroke intake"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Chipped, warped, or broken reed petals", "high", [
            T("A carburetor or reed-cage removal and a visual of every petal, plus a look in the intake for a missing corner",
              "Petals should seat flat and should not be chipped. A missing corner means you must look in the engine for the piece.",
              "Every petal is intact and seats flat",
              "A chipped or warped petal, or a piece missing"),
        ], "Replace the reeds as a set with the specified thickness. If a piece is missing, inspect the piston and the top end before you run it."),
    ],
))

print("after powersports engine", len(ENTRIES))

# ---------------------------------------------------------------------------
# Powersports: carburetor
# ---------------------------------------------------------------------------
add(dict(
    id="ps-carb-flood",
    system="powersports_carb",
    title="Carburetor flooding (fuel overflowing or a wet plug)",
    symptom="Fuel drips from the overflow, the plug is wet, or the engine is hard to start after sitting with the petcock left on.",
    means="A stuck float, a worn float needle, or a petcock that does not shut off will overfill the bowl. This is a fire risk if fuel is running onto a hot engine.",
    keywords=["flooding carb", "overflow", "stuck float"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=["ftc_basics"],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Stuck or mis-set float, a worn needle and seat, or a petcock left on with a leaking seat", "high", [
            T("Eyes at the overflow, a shut-off of the petcock, and a bowl inspection as the manual shows",
              "If fuel continues to run with the petcock off, the bowl is already full and the seat may still be leaking when you turn it back on. Check float height only at the manual's figure — do not invent a millimeter setting.",
              "The overflow is dry with the petcock on, and the float height is at the manual's setting",
              "Fuel keeps running from the overflow, or the needle is worn or dirty",
              MANUAL),
        ], "Clean or replace the needle and seat, set the float height to the manual, and repair a petcock that will not shut off. Dry or replace a fouled plug before a restart."),
    ],
))

add(dict(
    id="ps-carb-dirty",
    system="powersports_carb",
    title="Dirty or varnished carburetor — stale fuel",
    symptom="The machine sat with fuel in the bowl, then it will start only on starter fluid, or it runs and dies, or a mid-range is gone.",
    means="Ethanol-blend fuel varnishes jets and passages. The repair is a real cleaning of the jets and passages, not only a squirt of cleaner in the bowl.",
    keywords=["dirty carb", "varnish", "stale fuel", "jets"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Plugged pilot or main jet, or a varnished passage", "high", [
            T("A carburetor disassembly and a look through each jet and passage, plus a drain of the old fuel",
              "Hold each jet up to a light. A passage you cannot see through is plugged. Do not enlarge a jet to 'clean' it.",
              "Every jet and passage is clear, and fresh fuel is in the tank",
              "A blocked pilot or main, or varnish in the emulsion tube"),
        ], "Clean or replace the jets, use a new bowl gasket, and refill with fresh fuel. Store with a shut-off petcock and an emptied bowl if the machine will sit."),
    ],
))

add(dict(
    id="ps-carb-idle",
    system="powersports_carb",
    title="Two-stroke or small-engine idle and mixture-screw problems",
    symptom="The engine will not idle, idles too high, or hangs when you close the throttle. The mixture or idle screw seems to do nothing.",
    means="An idle screw only works if the pilot circuit is clear and the slide or butterfly actually closes. Settings come from the service manual — there is no universal 'turns out' number in this app.",
    keywords=["idle screw", "mixture screw", "high idle"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_RUNNING],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("A plugged pilot circuit, an air leak at the intake boot, or a screw that is already out of the manual's range", "high", [
            T("A spray or a careful listen at the intake boot for a leak (no open flame), plus a look at the pilot jet, and a comparison of the screw setting with the manual",
              "If the mixture screw does nothing, the pilot is usually blocked or there is a leak after the carb. If the idle is high, the slide or throttle cable may not be closing.",
              "The throttle closes, the boot is tight, and an idle can be set in the manual's screw range",
              "A cracked intake boot, a plugged pilot, or a cable that holds the slide open",
              MANUAL),
        ], "Clean the pilot circuit, replace a leaking boot, and set the screws to the service manual. Recheck idle when the engine is at the temperature the manual uses."),
    ],
))

add(dict(
    id="ps-carb-intake-leak",
    system="powersports_carb",
    title="Intake-boot or carburetor air leak (leans the engine)",
    symptom="A two-stroke or small four-stroke that runs lean, revs on its own, or has a hiss at the boot, sometimes after a boot has aged and cracked.",
    means="Unmetered air after the carb leans the mixture and can seize a two-stroke. A cracked boot is a common, inexpensive cause that gets missed.",
    keywords=["intake leak", "carb boot", "lean two stroke"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_2STROKE, "Do not use open flame to find a leak."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("A cracked intake boot, a loose clamp, or a leaking carburetor insulator", "high", [
            T("Eyes and a gentle tug on the boot, plus a soap or a carb-safe spray around the joint with the engine idling (if it will idle)",
              "A change in rpm when you wet the joint means a leak. Look for cracks hidden under the clamp.",
              "The boot is intact, the clamps are tight, and rpm does not change when you wet the joint",
              "A cracked boot or a loose clamp, or an rpm change at the joint"),
        ], "Replace the boot and tighten the clamps. Recheck jetting only after the leak is gone — do not richen a leaking engine and call it a jetting problem."),
    ],
))

add(dict(
    id="ps-carb-ice-altitude",
    system="powersports_carb",
    title="Carburetor icing, or a machine that runs differently at altitude or in hard cold",
    symptom="A sled or a small engine that loads up or dies in wet cold air, or a machine that is very lean or very rich after a big elevation change.",
    means="Jetting and slide settings are weather- and altitude-dependent. The service manual or a maker's jetting chart, not a guessed jet, is the source. Icing can also just be a frozen vent or a throttle that is sticking from ice.",
    keywords=["carb ice", "altitude jetting", "cold sled"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("A frozen vent or throttle, versus jetting that no longer matches the air", "high", [
            T("A look at the vents and the throttle for ice, and a comparison of the installed jets with the manual or the maker's chart for this elevation and temperature",
              "If ice is present, warm and dry the carb and vents first. Do not drill a jet to 'fix' altitude.",
              "The vents are clear, the throttle moves freely, and the jets match the chart for this day",
              "Ice in a vent, or jets that are clearly not the ones the chart lists for this elevation",
              MANUAL),
        ], "Clear the ice. Change jets only to the sizes the manual or the official chart lists for this condition."),
    ],
))

add(dict(
    id="ps-carb-fuel-starvation",
    system="powersports_carb",
    title="Fuel starvation — petcock, vent, or a failed fuel pump",
    symptom="The engine starts and then dies as if the fuel was shut off, or it fades on a long wide-open run. The tank may have fuel.",
    means="A closed or clogged petcock, a tank vent that is sealed, a pinched line, or a failed pulse or electric pump will starve the carb even though the tank is not empty.",
    keywords=["petcock", "fuel starvation", "tank vent", "pulse pump"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_FUEL],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Petcock, tank vent, a pinched line, or a pulse/electric pump", "high", [
            T("A brief, safe test of the cap vent (a loose cap as a test only), a look at the petcock screen, and a check that fuel actually flows to the carb or that a pulse pump is pulsing",
              "If loosening the cap immediately improves the run, the vent is blocked. If no fuel leaves the petcock, the screen or the valve is at fault.",
              "Fuel flows steadily to the carb with the cap on, and the pump (if equipped) works",
              "A blocked vent, a dry line at the carb, or a pulse pump with a torn diaphragm"),
        ], "Clean or replace the petcock, clear the vent, repair the line, or replace a failed pump. Recheck at the same wide-open load."),
    ],
))

# ---------------------------------------------------------------------------
# Powersports: CDI / stator ignition
# ---------------------------------------------------------------------------
add(dict(
    id="ps-cdi-no-spark",
    system="powersports_cdi",
    title="CDI ignition — no spark",
    symptom="A kick or a crank produces no spark at a tester, with the kill switch and tether in run.",
    means="CDI systems need a stator (source) coil, often a pickup (trigger) coil, a CDI box, a coil, a cap and plug, and a kill switch that is actually open in run. This app can open a CDI pinout profile for a matching vehicle — use it as a cited map, not as invented ohm values. Every resistance and air-gap number comes from the service manual.",
    keywords=["CDI no spark", "stator", "pickup coil", "kill switch"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=True,
    tier="generated-general",
    sources=[],
    safety=["Use a spark tester. High-tension spark can bite. Do not short a CDI output to ground in a way the manual forbids — you can destroy the box."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Kill switch, tether, or a grounded kill wire holding the CDI off", "high", [
            T("A spark test with the kill switch and tether in run, then a disconnection of the kill wire at the CDI if the manual allows that as a test",
              "If spark appears with the kill wire open, the switch, the tether, or the harness is grounding the kill circuit.",
              "Spark is present with the switches in run and the kill wire is not shorted to ground",
              "Spark appears only when the kill wire is opened, or the switch is shorted in the run position"),
        ], "Repair the switch, tether, or shorted kill wire. Recheck spark with everything connected."),
        C("Failed stator, pickup, CDI, or coil — tested only at the service-manual values", "high", [
            T("A multimeter on the stator and pickup at the pins the service manual (or a cited pinout in this app) identifies, at the resistance or the peak-voltage test the manual lists, plus a look at the flywheel for a sheared key",
              "If this vehicle has a CDI pinout profile in the app, use it only to identify pins and colors, and still use the manual's numbers. A sheared flywheel key will also kill or mistime the spark.",
              "Each winding and the pickup meet the manual's test, the flywheel key is intact, and the coil primary/secondary is in the manual's range",
              "A winding or a pickup is open or well outside the manual, a sheared key, or a CDI that has good inputs and still no output",
              MANUAL),
        ], "Replace only the part that failed its manual test. Recheck spark. Open the CDI pinout view in this app if a profile exists for this machine, and do not treat unverified electrical values as a specification."),
    ],
))

add(dict(
    id="ps-cdi-weak-spark",
    system="powersports_cdi",
    title="CDI ignition — weak or intermittent spark",
    symptom="A spark that is yellow and short, that cuts out when hot or wet, or that comes and goes over bumps.",
    means="A failing stator as it heats, a cracked coil, a loose flywheel, or a corroded connector will all look 'intermittent.' Test when the symptom is present.",
    keywords=["weak spark CDI", "intermittent spark", "hot no spark"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=True,
    tier="generated-general",
    sources=[],
    safety=["Do not hold the plug wire."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("A stator that fails hot, a cracked coil, or a loose or corroded connector", "high", [
            wiggle_harness("the stator, CDI, and coil connectors"),
            T("A repeat of the manual's stator or peak-voltage test when the engine is hot and the spark is failing, plus a flywheel-nut check",
              "A stator can pass cold and fail hot. A loose flywheel will also make an intermittent spark.",
              "The tests still pass when hot, the flywheel is tight, and the spark stays crisp",
              "A winding that falls out of the manual's range when hot, or a loose flywheel",
              MANUAL),
        ], "Replace the failed stator, coil, or connector, or tighten the flywheel to the manual. Recheck after a heat-soak."),
    ],
))

add(dict(
    id="ps-stator-charging",
    system="powersports_cdi",
    title="Stator or charging-system failure on a powersports machine",
    symptom="A battery that goes dead on a ride, lights that die at idle, or a regulator that is cooking a battery. Many bikes and ATVs use a stator under the flywheel for both lighting and battery charging.",
    means="Test the stator and the regulator at the manual's AC and DC figures. A shorted regulator can also ruin a new stator.",
    keywords=["stator charging", "motorcycle battery dies", "regulator rectifier"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=True,
    tier="generated-general",
    sources=["doe_battery"],
    safety=[SAFE_BATT],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("A failed stator, a failed regulator/rectifier, or a poor ground", "high", [
            T("A multimeter on AC from the stator and on DC at the battery, at the rpm the service manual lists, plus a look at the regulator ground and the connector for melted pins",
              "Do not invent a charging voltage. Use the manual. A melted regulator connector is a common, hidden cause.",
              "AC and DC meet the manual at the listed rpm, and the connector is clean and tight",
              "AC is already low (stator), or AC is good and DC is not (regulator), or the connector is melted",
              MANUAL),
        ], "Replace the failed stator or regulator, repair the ground, and load-test the battery. A cooked battery may also need replacement after the charging voltage is corrected."),
    ],
))

add(dict(
    id="ps-kill-switch",
    system="powersports_cdi",
    title="Kill switch, tether, or a sidestand switch is killing the spark",
    symptom="No spark, or a spark that dies when you put the machine in gear, step off a sidestand, or bump a tether.",
    means="These switches are designed to ground or open a circuit and kill the engine. A failed or misadjusted switch will also prevent a start. This is one of the first CDI checks, not the last.",
    keywords=["kill switch", "tether", "sidestand switch", "clutch switch"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=True,
    tier="generated-general",
    sources=[],
    safety=["Do not ride with a safety switch permanently bypassed. Repair it."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("A switch that is shorted, misadjusted, or wet", "high", [
            T("A spark test in run, then a disconnection of one switch at a time only as the manual allows, plus a look at a corroded sidestand or a crushed tether",
              "If opening one switch's connector brings spark back, that switch or its wire is the fault.",
              "Spark is present with every safety switch in the run or 'ok to start' position the manual describes",
              "A switch that is closed in the run position, or a wire that is shorted to ground"),
        ], "Replace or adjust the switch. Recheck that it still kills the engine when you use it on purpose."),
    ],
))

add(dict(
    id="ps-flywheel-key",
    system="powersports_cdi",
    title="Sheared flywheel key (mistimed spark)",
    symptom="The engine has spark and fuel, it may kick back, it may start and run very badly, or it will not start after a kick-back or a piston bump.",
    means="A sheared woodruff key lets the flywheel (and the timing) move on the crank. The marks will no longer line up. This can also look like a jumped cam chain on a four-stroke.",
    keywords=["flywheel key", "sheared key", "kick back"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=True,
    tier="generated-general",
    sources=[],
    safety=["A severe kick-back can injure a leg or a hand. Stop kicking a machine that kicks back hard and inspect the key."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("A sheared or partly sheared flywheel key", "high", [
            T("A look at the timing marks and a flywheel pull per the manual, after you have confirmed spark exists",
              "If the marks no longer line up, pull the flywheel with the correct puller — do not pry on the stator.",
              "The key is intact and the marks line up",
              "A sheared or mashed key, or a flywheel that has slipped"),
        ], "Replace the key (and inspect the crank and flywheel slots). Torque the nut to the manual. Recheck timing marks and spark."),
    ],
))

add(dict(
    id="ps-plug-cap",
    system="powersports_cdi",
    title="Spark-plug cap, plug, or a high-tension lead problem",
    symptom="A misfire, a shock when you touch the cap, or no spark at the plug with a spark at the coil wire (on machines that have a separate cap).",
    means="Caps crack, resistors open, and plugs foul. Resistance values, if used, come from the service manual.",
    keywords=["plug cap", "spark plug powersports", "resistor cap"],
    audience=["powersports", "snowmobile"],
    cdi_workflow=True,
    tier="generated-general",
    sources=[],
    safety=["Use a tester. Do not hold the cap."],
    difficulty="easy",
    related_dtcs=[],
    causes=[
        C("A cracked cap, an open resistor, or a fouled or wrong-heat-range plug", "high", [
            T("A spark tester at the cap, a look at the plug, and an ohmmeter on the cap only at the manual's specification",
              "A cap that is open will kill the spark at the plug. A very oily or wet plug will also hide a good spark.",
              "The cap is in the manual's resistance range, the plug is the specified type, and the tester shows a crisp spark at the plug",
              "An open cap, a cracked cap, or a plug that is the wrong type or is fouled",
              MANUAL),
        ], "Replace the cap or the plug with the specified parts. Recheck spark at the plug, not only at the coil."),
    ],
))

# ---------------------------------------------------------------------------
# Powersports: snowmobile clutch / track
# ---------------------------------------------------------------------------
add(dict(
    id="sm-clutch-belt",
    system="powersports_snowmobile",
    title="Snowmobile belt slips, burns, or will not engage",
    symptom="The engine revs and the sled does not take off, or you smell a burnt belt, or the belt is thrown.",
    means="A worn or glazed belt, a wrong belt, an incorrect clutch offset or alignment, or a clutch that is frozen with ice or rust will slip. Clutch work is a stopped-engine job — clutches can throw parts.",
    keywords=["snowmobile belt", "clutch slip", "burnt belt"],
    audience=["snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_CLUTCH],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Worn or glazed belt, or a clutch alignment / offset that is out of the manual", "high", [
            T("A belt-width and belt-part check, a look at the sheaves for glaze or rust, and an alignment or offset measurement only with the tool and the figures the service manual lists",
              "Do not invent an offset. A belt that is too narrow or too long will also slip.",
              "The belt is the specified part, it is within wear limits, and the offset/alignment is in the manual's range",
              "A glazed, burned, or wrong belt, rusty sheaves, or an offset that is out of specification",
              MANUAL),
        ], "Replace the belt with the specified part. Clean or repair the sheaves. Set alignment and offset only to the manual. Recheck engagement."),
    ],
))

add(dict(
    id="sm-clutch-engagement",
    system="powersports_snowmobile",
    title="Snowmobile clutch engages too early, too late, or harshly",
    symptom="The sled creeps at idle, or it needs a lot of rpm before it moves, or it hits with a bang.",
    means="Engagement rpm is a clutch-spring, weight, and helix setup. Those values are in the service or clutching manual for this model — not a generic number.",
    keywords=["engagement rpm", "clutch harsh", "creeps at idle"],
    audience=["snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_CLUTCH],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("Worn springs or a clutching setup that does not match the manual for this use", "high", [
            T("A safe measurement of engagement rpm with a tachometer the manual accepts, plus a visual of the primary springs and weights",
              "Compare engagement rpm with the specification for this model. A creeping sled at a high idle may also just need a lower idle if the idle was raised.",
              "Engagement is in the manual's rpm range and idle is at the specified idle",
              "It creeps at a correct idle, or it engages far above or below the listed rpm",
              MANUAL),
        ], "Set idle first. Then correct springs, weights, or helix only to a combination the manufacturer publishes for this machine and this use."),
    ],
))

add(dict(
    id="sm-track-wont-turn",
    system="powersports_snowmobile",
    title="Snowmobile track will not turn, or the sled will not move with the clutch engaged",
    symptom="The belt is turning, or the jackshaft is turning, and the track is locked, or the sled will not move in the snow.",
    means="A frozen track, a frozen brake, a locked chaincase, or ice packed in the tunnel can all hold a sled still. Forcing it with more throttle can tear a track or a belt.",
    keywords=["track locked", "frozen track", "sled won't move"],
    audience=["snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_CLUTCH, "Never stand behind a track or put a hand in a track with the engine running. A frozen track can suddenly break loose."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("A track frozen to the ice, a stuck brake, or a locked chaincase", "high", [
            T("A walk-around with the engine off: try to move the track by hand the way the manual allows, check the brake lever, and look for ice packed in the tunnel or a seized slider",
              "A track that will not budge by hand on ice is often frozen down. A free track and a locked driveshaft is a brake or a chaincase problem.",
              "The track can be moved by hand (engine off) and the brake is released",
              "The track is frozen down, the brake is dragging, or the chaincase will not turn"),
        ], "Free a frozen track the safe way (do not just apply more throttle). Service a dragging brake or a chaincase that has no oil or a broken chain."),
    ],
))

add(dict(
    id="sm-track-align",
    system="powersports_snowmobile",
    title="Snowmobile track is misaligned or the sliders are wearing fast",
    symptom="The track is closer to one rail than the other, it rubs a side rail, or the wear bars (sliders) are gone on one side.",
    means="Track alignment and tension are service-manual measurements. A loose or uneven axle, a bent rail, or a worn idler will walk the track over.",
    keywords=["track alignment", "slider wear", "track tension"],
    audience=["snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_CLUTCH, "Adjust only with the engine off. A running track will pull tools and hands in."],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Tension or alignment out of specification, or a bent rail or a worn idler", "high", [
            T("The service-manual track-tension and alignment procedure, usually on a stand or a specified support, plus a look at the sliders and the idler wheels",
              "Do not guess a sag. Measure where the manual says to measure. Then align so the track gap is even on both sides as specified.",
              "Tension and alignment are in the manual's range, and the sliders are even",
              "A tight or very loose track, a track that walks to one rail, or a slider worn through on one side",
              MANUAL),
        ], "Set tension and alignment to the manual. Replace worn sliders and a damaged idler or rail. Recheck after a short, careful ride."),
    ],
))

add(dict(
    id="sm-chaincase",
    system="powersports_snowmobile",
    title="Snowmobile chaincase noise, leak, or a broken chain",
    symptom="A rattle or a grind from the chaincase, a leak at the seal or the filler, or a sudden loss of drive with the belt still intact.",
    means="The chaincase has its own oil. A low fill or a stretched chain will ruin the gears and the chain. This is separate from the belt and the clutches.",
    keywords=["chaincase", "snowmobile chain", "chaincase oil"],
    audience=["snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=[SAFE_CLUTCH],
    difficulty="moderate",
    related_dtcs=[],
    causes=[
        C("Low or the wrong chaincase oil, a stretched chain, or a failed bearing or seal", "high", [
            T("A level and type check of the chaincase oil, a listen, and an inspection of the chain and sprockets if you open it per the manual",
              "Use only the lubricant the manual lists. A pink or milky oil may mean water is in the case.",
              "The oil is at the level and type the manual lists, and the case is reasonably quiet",
              "A low or milky fill, a rattle of a loose chain, or metal in the oil",
              MANUAL),
        ], "Service the oil. Replace a stretched chain and worn sprockets as a set if the manual requires it. Repair a leaking seal so the case does not run dry again."),
    ],
))

add(dict(
    id="sm-track-clips-tears",
    system="powersports_snowmobile",
    title="Torn track, missing clips, or a thrown lug",
    symptom="The sled slaps, vibrates, or loses drive after a rock, a bare parking lot, or a worn slider that cut the track.",
    means="A track can be damaged by a missing slider, a misaligned rail, or running on a bare surface. A badly torn track is not a 'keep riding it' part.",
    keywords=["torn track", "track clips", "thrown lug"],
    audience=["snowmobile"],
    cdi_workflow=False,
    tier="generated-general",
    sources=[],
    safety=["A coming-apart track can damage the tunnel and the heat exchangers. Stop and inspect."],
    difficulty="advanced",
    related_dtcs=[],
    causes=[
        C("A track already cut by a worn slider or a rock, or clips that have come off", "high", [
            T("A full walk around the track, engine off, looking at lugs, clips, and the sliders",
              "A slider worn through to the rail will cut the track. Missing clips can also rust and fail neighboring clips.",
              "The track is intact, clips are present, and the sliders still have meat",
              "A tear, a missing row of clips, or a slider worn through"),
        ], "Replace a damaged track. Replace worn sliders before they cut a new one. Recheck alignment and tension after a track job."),
    ],
))

print("total entries", len(ENTRIES))

# ---------------------------------------------------------------------------
# Write JS + manifest
# ---------------------------------------------------------------------------

def main():
    ids = [e["id"] for e in ENTRIES]
    if len(ids) != len(set(ids)):
        from collections import Counter
        dup = [i for i, c in Counter(ids).items() if c > 1]
        raise SystemExit(f"duplicate ids: {dup}")
    systems_used = {e["system"] for e in ENTRIES}
    expected = set()
    # imported from engine labels — keep in sync
    expected = {
        "engine_no_start", "misfire", "cooling", "fuel", "ignition",
        "starting_charging", "electrical", "transmission_auto", "transmission_manual",
        "four_wd", "drivetrain", "brakes", "steering_suspension", "hvac",
        "exhaust_emissions", "leaks", "noises_vibrations", "smells", "smoke",
        "body_srs", "powersports_engine", "powersports_carb", "powersports_cdi",
        "powersports_snowmobile",
    }
    missing = expected - systems_used
    extra = systems_used - expected
    if missing or extra:
        raise SystemExit(f"system mismatch missing={missing} extra={extra}")

    by_system = {}
    by_tier = {"cited": 0, "generated-general": 0}
    for e in ENTRIES:
        by_system[e["system"]] = by_system.get(e["system"], 0) + 1
        by_tier[e["tier"]] = by_tier.get(e["tier"], 0) + 1
        if not e["causes"]:
            raise SystemExit(f"no causes: {e['id']}")
        for c in e["causes"]:
            if not c["tests"]:
                raise SystemExit(f"no tests: {e['id']} / {c['title']}")
            for t in c["tests"]:
                if not all(t.get(k) for k in ("tool", "check", "good", "bad", "spec")):
                    raise SystemExit(f"incomplete test: {e['id']}")

    source_ids = {s["id"] for s in SOURCES}
    for e in ENTRIES:
        for sid in e["sources"]:
            if sid not in source_ids:
                raise SystemExit(f"unknown source {sid} on {e['id']}")

    db = {
        "version": 1,
        "title": "ATDD classic symptom and system repair database",
        "entries": ENTRIES,
        "sources": SOURCES,
    }
    payload = json.dumps(db, ensure_ascii=False, separators=(",", ":"))
    header = """/* Symptom- and system-based repair database for classic ATDD.
   Procedures are original wording. Cited meanings come from license-compatible
   government consumer publications listed in the manifest. Numeric specs are
   'per service manual' unless a test cites a universal value from those sources.
   This file is generated by atdd/scripts/build-symptom-repair-db.py. */
"""
    js = (
        header
        + "(function (root) {\n"
        + "  root.SYMPTOM_REPAIR_DB = "
        + payload
        + ";\n"
        + "})(typeof window !== 'undefined' ? window : globalThis);\n"
    )
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(js, encoding="utf-8")
    sha = hashlib.sha256(OUT_JS.read_bytes()).hexdigest()
    manifest = {
        "file": "symptom-repair-db.js",
        "sha256": sha,
        "entry_count": len(ENTRIES),
        "by_system": dict(sorted(by_system.items())),
        "by_tier": by_tier,
        "sources": [
            {"id": s["id"], "name": s["name"], "url": s["url"], "license": s["license"]}
            for s in SOURCES
        ],
        "licenses_note": (
            "U.S. federal publications cited here (FTC, EPA, NHTSA, DOE / FuelEconomy.gov, "
            "DOE-HDBK-1084-95) are U.S. government works and are treated as public domain "
            "under 17 U.S.C. § 105. Oregon DEQ and Pennsylvania DEP smoking-vehicle tables "
            "are state government consumer publications; this app cites the facts (smoke-color "
            "meanings, condensation note) in original wording and does not copy the tables. "
            "SAE, ISO, and vehicle-maker manuals are not reproduced. Test procedures are "
            "original wording written for this app."
        ),
        "cited_universal_specs": [
            SPEC_TIRE_TREAD,
            SPEC_TIRE_COLD,
            SPEC_SHOCK_BOUNCE,
            SPEC_DOE_OCV,
        ],
        "generated_by": "atdd/scripts/build-symptom-repair-db.py",
    }
    OUT_MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT_JS, "entries", len(ENTRIES), "bytes", OUT_JS.stat().st_size)
    print("tiers", by_tier)
    print("systems", json.dumps(by_system, indent=2))


if __name__ == "__main__":
    main()
