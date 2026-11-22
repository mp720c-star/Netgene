/* CDI Genius pinoutDB extracted verbatim from runtime web/app.js. Labels preserved. No values invented. */
(function (root) {
  root.CDI_PINOUT_DB = {
  "source": "CDI_Genius_Runtime_Source.zip:web/app.js",
  "source_app_js_sha256": "b01eee6cd36be89a57eec5888a0aead379379c2e21a636efff8c249838da5a2c",
  "profile_count": 71,
  "slot_count": 448,
  "provenance_counts": {
    "reference": 4,
    "unverified": 9,
    "verified": 58
  },
  "profiles": {
    "GENERIC_DC": {
      "source_key": "GENERIC_DC",
      "name": "CORE: 6-Pin DC (GY6/ATV Standard)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "source": "Generic DC CDI Unit (Target)",
      "category": "Core / Generic Reference",
      "provenance": "reference",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "12V",
          "active": true,
          "role": "Battery Power (Switched)",
          "funcKey": "POWER",
          "desc": "Requires 12V DC, typically switched by the ignition key.",
          "volt": "12V DC",
          "colors": [
            "Black",
            "Red/Blk"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground connection to the chassis or engine block.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Timing Signal (+)",
          "funcKey": "PULSE",
          "desc": "Input signal from the magnet/pulser coil for timing reference.",
          "volt": "0.5V-5V AC",
          "colors": [
            "Blu/Wht"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Spark Coil",
          "funcKey": "COIL",
          "desc": "High voltage trigger signal sent to the primary winding of the ignition coil.",
          "volt": "400V peak",
          "colors": [
            "Blk/Yel"
          ]
        },
        {
          "pin": 5,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Grounds the internal power source, stopping the spark (Ground-to-Kill logic).",
          "volt": "N/A",
          "colors": [
            "Blk/Wht"
          ]
        },
        {
          "pin": 6,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Output/Aux",
          "funcKey": "TACH",
          "desc": "Outputs a signal for a tachometer or other auxiliary devices.",
          "volt": "Pulse",
          "colors": [
            "Yel/Blk"
          ]
        }
      ]
    },
    "GENERIC_AC": {
      "source_key": "GENERIC_AC",
      "name": "CORE: 5-Pin AC (Pit Bike/Older Scooter)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "source": "Generic AC CDI Unit (Source)",
      "category": "Core / Generic Reference",
      "provenance": "reference",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Stator",
          "funcKey": "POWER",
          "desc": "High voltage AC power feed directly from the stator charge coil.",
          "volt": "100V-300V AC",
          "colors": [
            "Blk/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Grounding this pin stops the engine.",
          "volt": "N/A",
          "colors": [
            "Blk/Wht"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground connection to the chassis or engine block.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Spark Coil",
          "funcKey": "COIL",
          "desc": "High voltage trigger signal sent to the primary winding of the ignition coil.",
          "volt": "400V peak",
          "colors": [
            "Blk/Yel"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE",
          "active": true,
          "role": "Timing Signal (+)",
          "funcKey": "PULSE",
          "desc": "Input signal from the magnet/pulser coil for timing reference.",
          "volt": "0.5V-5V AC",
          "colors": [
            "Blu/Wht"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused pin slot (Pin 6 is often empty on 5-pin units).",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "SIM_DC_01": {
      "source_key": "SIM_DC_01",
      "name": "SIMULATED: DC 6-Pin (High Rev Limit)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "source": "Simulated DC Unit 01",
      "category": "Simulated Generic Profiles",
      "provenance": "reference",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "12V",
          "active": true,
          "role": "Battery Power (Switched)",
          "funcKey": "POWER",
          "desc": "High performance unit requires stable 12V DC input.",
          "volt": "12V DC",
          "colors": [
            "Red"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Chassis ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Timing Signal (+)",
          "funcKey": "PULSE",
          "desc": "Input signal from pulser coil.",
          "volt": "Low AC",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Spark Coil",
          "funcKey": "COIL",
          "desc": "Ignition coil trigger.",
          "volt": "400V peak",
          "colors": [
            "Yellow/Red"
          ]
        },
        {
          "pin": 5,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Ground-to-kill wire.",
          "volt": "N/A",
          "colors": [
            "Brown/Wht"
          ]
        },
        {
          "pin": 6,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Output",
          "funcKey": "TACH",
          "desc": "Tach signal output.",
          "volt": "Pulse",
          "colors": [
            "Orange"
          ]
        }
      ]
    },
    "SIM_AC_01": {
      "source_key": "SIM_AC_01",
      "name": "SIMULATED: AC 4-Pin (Basic Off-Road)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid-small",
      "source": "Simulated AC Unit 01",
      "category": "Simulated Generic Profiles",
      "provenance": "reference",
      "pins": 4,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Stator",
          "funcKey": "POWER",
          "desc": "High voltage AC power feed from stator.",
          "volt": "100V-250V AC",
          "colors": [
            "Red/Blk"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground connection.",
          "volt": "0V",
          "colors": [
            "Green/Wht"
          ]
        },
        {
          "pin": 3,
          "label": "COIL",
          "active": true,
          "role": "Output to Spark Coil",
          "funcKey": "COIL",
          "desc": "Ignition coil trigger.",
          "volt": "400V peak",
          "colors": [
            "Blk/Yel"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE",
          "active": true,
          "role": "Timing Signal (+)",
          "funcKey": "PULSE",
          "desc": "Input signal from pulser coil.",
          "volt": "Low AC",
          "colors": [
            "Blu/Wht"
          ]
        },
        {
          "pin": 5,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "CHINESE_GY6_DC": {
      "source_key": "CHINESE_GY6_DC",
      "name": "ATV: Chinese GY6 150cc (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "source": "No independent source citation on record for this profile (predates the app's source-citation practice). Treat as unverified until checked against a real GY6 service manual.",
      "category": "ATVs / 4-Wheelers",
      "provenance": "unverified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "12V+",
          "active": true,
          "role": "Battery Power (Switched)",
          "funcKey": "POWER",
          "desc": "DC Ignition power from key switch.",
          "volt": "12V DC",
          "colors": [
            "Red/Blk",
            "Blk"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Chassis ground.",
          "volt": "0V",
          "colors": [
            "Green",
            "Green/Wht"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Timing Signal (Pickup Coil +)",
          "funcKey": "PULSE",
          "desc": "Positive pulser coil signal.",
          "volt": "Low AC",
          "colors": [
            "Blu/Wht"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Spark Coil",
          "funcKey": "COIL",
          "desc": "Ignition coil trigger.",
          "volt": "400V peak",
          "colors": [
            "Blk/Yel"
          ]
        },
        {
          "pin": 5,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Ground-to-kill wire.",
          "volt": "N/A",
          "colors": [
            "Blk/Wht"
          ]
        },
        {
          "pin": 6,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Signal",
          "funcKey": "TACH",
          "desc": "Tach signal output.",
          "volt": "Pulse",
          "colors": [
            "Yel/Blk"
          ]
        }
      ]
    },
    "YAMAHA_GRIZZLY_400": {
      "source_key": "YAMAHA_GRIZZLY_400",
      "name": "ATV: Yamaha Grizzly 400 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "source": "No independent source citation on record for this profile (predates the app's source-citation practice). Treat as unverified until checked against a real Grizzly 400 service manual.",
      "category": "ATVs / 4-Wheelers",
      "provenance": "unverified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "12V",
          "active": true,
          "role": "Switched Power",
          "funcKey": "POWER",
          "desc": "Key-switched 12V battery power.",
          "volt": "12V DC",
          "colors": [
            "Red/Wht"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "Ground",
          "funcKey": "GND",
          "desc": "Main system ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil (+)",
          "funcKey": "PULSE",
          "desc": "Positive lead from the timing pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Wht/Red"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "To Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 5,
          "label": "KILL",
          "active": true,
          "role": "Stop Circuit",
          "funcKey": "KILL",
          "desc": "Engine stop/kill switch wire.",
          "volt": "N/A",
          "colors": [
            "Red/Blk"
          ]
        },
        {
          "pin": 6,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Signal",
          "funcKey": "TACH",
          "desc": "Tachometer signal output.",
          "volt": "Pulse",
          "colors": [
            "Wht/Blu"
          ]
        }
      ]
    },
    "HONDA_TRX300EX_AC": {
      "source_key": "HONDA_TRX300EX_AC",
      "name": "ATV: Honda TRX300EX (AC)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "source": "No independent source citation on record for this profile (predates the app's source-citation practice). Treat as unverified until checked against a real TRX300EX service manual.",
      "category": "ATVs / 4-Wheelers",
      "provenance": "unverified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Stator",
          "funcKey": "POWER",
          "desc": "High voltage power from the exciter coil.",
          "volt": "100V-200V AC",
          "colors": [
            "Blk/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Grounding this pin stops the spark.",
          "volt": "N/A",
          "colors": [
            "Blk/Wht"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis ground.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Spark Coil",
          "funcKey": "COIL",
          "desc": "Trigger signal to the ignition coil.",
          "volt": "400V peak",
          "colors": [
            "Blk/Yel"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Timing Signal (+)",
          "funcKey": "PULSE",
          "desc": "Input signal from the timing pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blu/Yel"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Timing Signal (-)",
          "funcKey": "GND",
          "desc": "Pulser coil ground/negative return. (Note: This is often also Pin 3/GND)",
          "volt": "0V",
          "colors": [
            "Wht/Yel"
          ]
        }
      ]
    },
    "SUZUKI_GSXR750": {
      "source_key": "SUZUKI_GSXR750",
      "name": "BIKE: Suzuki GSX-R 750 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "source": "No independent source citation on record for this profile (predates the app's source-citation practice). Treat as unverified until checked against a real GSX-R 750 service manual.",
      "category": "Motorcycles / Bikes",
      "provenance": "unverified",
      "pins": 8,
      "slots": [
        {
          "pin": 1,
          "label": "12V+",
          "active": true,
          "role": "Switched Power",
          "funcKey": "POWER",
          "desc": "Primary DC power input.",
          "volt": "12V DC",
          "colors": [
            "Orange/Wht"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main system ground.",
          "volt": "0V",
          "colors": [
            "Blk/Wht"
          ]
        },
        {
          "pin": 3,
          "label": "COIL A",
          "active": true,
          "role": "Ignition Coil Output (Cyl 1/4)",
          "funcKey": "COIL",
          "desc": "Output for ignition coils.",
          "volt": "400V peak",
          "colors": [
            "Yellow/Blk"
          ]
        },
        {
          "pin": 4,
          "label": "COIL B",
          "active": true,
          "role": "Ignition Coil Output (Cyl 2/3)",
          "funcKey": "COIL_AUX",
          "desc": "Auxiliary coil output (Treated as COIL for mapping).",
          "volt": "400V peak",
          "colors": [
            "Pink/Wht"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE 1",
          "active": true,
          "role": "Timing Signal (Pickup 1)",
          "funcKey": "PULSE",
          "desc": "Primary timing pulse input.",
          "volt": "Low AC",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE 2",
          "active": true,
          "role": "Timing Signal (Pickup 2)",
          "funcKey": "PULSE_AUX",
          "desc": "Secondary timing pulse input (Treated as PULSE for mapping).",
          "volt": "Low AC",
          "colors": [
            "Yellow"
          ]
        },
        {
          "pin": 7,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Kill switch input.",
          "volt": "N/A",
          "colors": [
            "Red/Blk"
          ]
        },
        {
          "pin": 8,
          "label": "TACH/EFI",
          "active": true,
          "role": "Tachometer/EFI AUX",
          "funcKey": "TACH",
          "desc": "Tach signal or other ECU aux communication.",
          "volt": "Pulse/Data",
          "colors": [
            "Wht/Blu"
          ]
        }
      ]
    },
    "KAWASAKI_KLR650_AC": {
      "source_key": "KAWASAKI_KLR650_AC",
      "name": "BIKE: Kawasaki KLR650 (AC - Pre-2008)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "source": "No independent source citation on record for this older AC profile (predates the app's source-citation practice). IgniTech SPARKER DC-CDI KLR650 manual was read 2026-09-06 (https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Kawasaki%20KLR650.doc) and does NOT match these wire colors — that DC SPARKER install is stored separately as KAWASAKI_KLR650_DC. Treat this AC record as unverified until checked against a real pre-2008 KLR650 service manual.",
      "category": "Dirt Bikes / Dual-Sport",
      "provenance": "unverified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Stator",
          "funcKey": "POWER",
          "desc": "Power from the exciter coil.",
          "volt": "150V-250V AC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground connection (Black/Yellow).",
          "volt": "0V",
          "colors": [
            "Blk/Yel"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Timing Signal (+)",
          "funcKey": "PULSE",
          "desc": "Pickup coil positive.",
          "volt": "Low AC",
          "colors": [
            "Wht/Red"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Spark Coil",
          "funcKey": "COIL",
          "desc": "Ignition coil trigger wire.",
          "volt": "400V peak",
          "colors": [
            "Red"
          ]
        },
        {
          "pin": 5,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Kill switch/ignition switch wire.",
          "volt": "N/A",
          "colors": [
            "Grey"
          ]
        },
        {
          "pin": 6,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Output",
          "funcKey": "TACH",
          "desc": "Tachometer signal output.",
          "volt": "Pulse",
          "colors": [
            "Wht/Blu"
          ]
        }
      ]
    },
    "POLARIS_INDY500_AC": {
      "source_key": "POLARIS_INDY500_AC",
      "name": "SLED: Polaris Indy 500 (AC)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid-small",
      "source": "No independent source citation on record for this profile (predates the app's source-citation practice). Treat as unverified until checked against a real Indy 500 service manual.",
      "category": "Snowmobiles / Sleds",
      "provenance": "unverified",
      "pins": 4,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Stator",
          "funcKey": "POWER",
          "desc": "Power from the lighting/exciter coil.",
          "volt": "100V-200V AC",
          "colors": [
            "Red/Blk"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Engine shut-off wire.",
          "volt": "N/A",
          "colors": [
            "Brown/Wht"
          ]
        },
        {
          "pin": 3,
          "label": "COIL",
          "active": true,
          "role": "Output to Spark Coil",
          "funcKey": "COIL",
          "desc": "Ignition coil trigger.",
          "volt": "400V peak",
          "colors": [
            "Yellow/Blk"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE+",
          "active": true,
          "role": "Timing Signal (+)",
          "funcKey": "PULSE",
          "desc": "Pickup coil positive.",
          "volt": "Low AC",
          "colors": [
            "Wht/Green"
          ]
        },
        {
          "pin": 5,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "SKI_DOO_REV_DC": {
      "source_key": "SKI_DOO_REV_DC",
      "name": "SLED: Ski-Doo Rev (DC, R.E.R.)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "source": "No independent source citation on record for this profile (predates the app's source-citation practice). Treat as unverified until checked against a real Ski-Doo Rev service manual.",
      "category": "Snowmobiles / Sleds",
      "provenance": "unverified",
      "pins": 8,
      "slots": [
        {
          "pin": 1,
          "label": "12V+",
          "active": true,
          "role": "Switched Power",
          "funcKey": "POWER",
          "desc": "Primary 12V DC input.",
          "volt": "12V DC",
          "colors": [
            "Yellow/Blk"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main system ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "COIL 1",
          "active": true,
          "role": "Ignition Coil Output 1",
          "funcKey": "COIL",
          "desc": "Output for coil 1.",
          "volt": "400V peak",
          "colors": [
            "Red/Wht"
          ]
        },
        {
          "pin": 4,
          "label": "COIL 2",
          "active": true,
          "role": "Ignition Coil Output 2",
          "funcKey": "COIL_AUX",
          "desc": "Output for coil 2 (Treated as COIL for mapping).",
          "volt": "400V peak",
          "colors": [
            "Blu/Wht"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Timing Signal (+)",
          "funcKey": "PULSE",
          "desc": "Primary timing pulse input.",
          "volt": "Low AC",
          "colors": [
            "Gray/Blk"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Timing Signal (-)",
          "funcKey": "GND",
          "desc": "Pulser coil ground/negative.",
          "volt": "0V",
          "colors": [
            "Yellow/Red"
          ]
        },
        {
          "pin": 7,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt (DESS)",
          "funcKey": "KILL",
          "desc": "Stop circuit, often integrated with DESS key.",
          "volt": "N/A",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 8,
          "label": "AUX",
          "active": true,
          "role": "Fuel Pump / R.E.R.",
          "funcKey": "AUX",
          "desc": "Auxiliary output for fuel pump or Reverse Electronic Rotax (R.E.R) system.",
          "volt": "Pulse/12V",
          "colors": [
            "Pink"
          ]
        }
      ]
    },
    "HONDA_XR650L_DC": {
      "source_key": "HONDA_XR650L_DC",
      "name": "BIKE: Honda XR650L (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI-P' installation manual for Honda XR650L (OEM wire colors as documented by IgniTech), read directly from source PDF: https://www.ignitech.cz/en/vyrobky/bikes/honda/xr650l/xr650l.pdf",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply to the ignition control unit.",
          "volt": "12V DC",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground return for the ignition control unit.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Input (CKPS)",
          "funcKey": "PULSE",
          "desc": "Timing signal from the crank pulse pickup (CKPS) used to trigger ignition timing.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger signal sent to the ignition coil primary winding.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop / Blocking Input",
          "funcKey": "KILL",
          "desc": "Grounding this input stops the engine (engine stop switch / blocking circuit).",
          "volt": "N/A",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 6,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Output",
          "funcKey": "TACH",
          "desc": "Pulse output usable for driving an aftermarket tachometer.",
          "volt": "Pulse",
          "colors": [
            "Green/Yellow"
          ]
        }
      ]
    },
    "HONDA_XL600_DC": {
      "source_key": "HONDA_XL600_DC",
      "name": "BIKE: Honda XL600 (DC, kickstart)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' installation manual for Honda XL600 without electric starter (OEM wire colors as documented by IgniTech), read directly from source PDF: https://www.ignitech.cz/en/vyrobky/bikes/honda/xl600/xl600.pdf",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply, commonly tapped at the charging regulator circuit.",
          "volt": "12V DC",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the magneto pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "Green/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the handlebar kill switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "SUZUKI_DR650_DC": {
      "source_key": "SUZUKI_DR650_DC",
      "name": "BIKE: Suzuki DR650 (DC, kickstart)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' installation manual for Suzuki DR650 without electric starter (OEM wire colors as documented by IgniTech), read directly from source PDF: https://www.ignitech.cz/cz/vyrobky/bikes/suzuki/dr650_without_starter/dr650_without_starter.pdf — NOTE: source doc also lists separate sidestand-switch and neutral-switch/indicator wires (Green, Blue, Blue/Black) not modeled here since they fall outside this app's 6-function schema.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply, commonly tapped at the horn circuit.",
          "volt": "12V DC",
          "colors": [
            "Orange/Green"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the magneto pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/White"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the handlebar kill switch.",
          "volt": "N/A",
          "colors": [
            "Black/Yellow"
          ]
        }
      ]
    },
    "HONDA_NX650_DOMINATOR_DC": {
      "source_key": "HONDA_NX650_DOMINATOR_DC",
      "name": "BIKE: Honda NX650 Dominator (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-small",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI-P' installation manual for Honda NX650. IgniTech publishes two variants of this manual ('with block' and 'without block', referring to the sidestand-interlock/blocking input feature) at https://www.ignitech.cz/en/vyrobky/dccdip/dccdip_manual — read both directly (https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Honda%20NX650%20with%20block.doc and .../Honda%20NX650%20without%20block.doc) and confirmed both document identical POWER/GND/PULSE/COIL wiring; they differ only in the blocking-input wire, which this app does not model. Neither variant documents a kill-switch or tachometer wire color, so those functions are left unused rather than guessed.",
      "provenance": "verified",
      "pins": 4,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply to the ignition control unit.",
          "volt": "12V DC",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground return for the ignition control unit.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the magneto pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM kill-switch wire color for this variant — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM tachometer wire color for this variant — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "KTM_SX250_AC": {
      "source_key": "KTM_SX250_AC",
      "name": "BIKE: KTM SX250 (AC, 2-Stroke MX)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI-P' installation manual for KTM SX250, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/KTM%20SX250.doc — OEM: AC magneto Black/Red and Red/White; ground Black/White; pickup Green / pickup return Red; coil White/Blue; kill Black/Yellow. SPARKER tach and gear-shift outputs have no OEM wire colors in this doc, so those functions are left unused rather than guessed.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Magneto (AC)",
          "funcKey": "POWER",
          "desc": "AC power feed directly from the flywheel magneto lighting/charge coil; this is a battery-less ignition system.",
          "volt": "100V-200V AC",
          "colors": [
            "Black/Red",
            "Red/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the magneto pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "Red"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the handlebar kill button.",
          "volt": "N/A",
          "colors": [
            "Black/Yellow"
          ]
        }
      ]
    },
    "GASGAS_EC250_AC": {
      "source_key": "GASGAS_EC250_AC",
      "name": "BIKE: Gas Gas EC250 (AC, 2-Stroke Enduro)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI-P' installation manual for Gas Gas EC250, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Gas%20Gas%20EC250.doc — OEM: AC magneto Black/Red and Red/White; ground Black or Black/White; pickup Green / pickup return Red; coil White/Blue; kill Black/Yellow. DCCDI and DCCDIP tables match for these functions.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Magneto (AC)",
          "funcKey": "POWER",
          "desc": "AC power feed directly from the flywheel magneto lighting/charge coil; this is a battery-less ignition system.",
          "volt": "100V-200V AC",
          "colors": [
            "Black/Red",
            "Red/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black",
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the magneto pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "Red"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the handlebar kill button.",
          "volt": "N/A",
          "colors": [
            "Black/Yellow"
          ]
        }
      ]
    },
    "SUZUKI_FREEWIND_DC": {
      "source_key": "SUZUKI_FREEWIND_DC",
      "name": "BIKE: Suzuki Freewind XF650 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Motorcycles / Bikes",
      "source": "IgniTech 'SPARKER DC-CDI-P' installation manual for Suzuki Freewind, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Suzuki%20Freewind.doc — OEM: +12V Orange/White; ground Black/White; pickup Blue / pickup return Green; coil White/Blue; tach Black/Red. Source table has no dedicated kill-switch wire, so KILL is not modeled. Gear-shift/solenoid Green/Blue is outside this app's 6-function schema and is not modeled.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Orange/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the magneto pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 6,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Output",
          "funcKey": "TACH",
          "desc": "Pulse output usable for driving an aftermarket tachometer.",
          "volt": "Pulse",
          "colors": [
            "Black/Red"
          ]
        }
      ]
    },
    "YAMAHA_DT125LC_DC": {
      "source_key": "YAMAHA_DT125LC_DC",
      "name": "BIKE: Yamaha DT125LC (DC, 2-Stroke)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI-P' installation manual for Yamaha DT125LC, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Yamaha%20DT125LC.doc — OEM: +12V Brown (from ignition key); ground Black; pickup White/Red / pickup return White/Green; coil Orange. SPARKER lists a KILL SWITCH input and TACHO output with no OEM wire colors, so those functions are left unused rather than guessed. Sidestand/neutral blocking and YPVS (Black/White) are outside this app's 6-function schema and are not modeled.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the magneto pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "White/Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_YFM200_1984_DC": {
      "source_key": "YAMAHA_YFM200_1984_DC",
      "name": "ATV: Yamaha YFM200 (1984, DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "ATVs / 4-Wheelers",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for quad Yamaha YFM200 1984, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20YFM200%201984.doc — OEM: +12V Brown (from key switch); ground Black; pickup White/Green and White/Red; coil Orange; engine stop Black/White. Document labels both pickup wires as pickup without stating polarity.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply from the ignition switch.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "PULSE",
          "desc": "One lead of the pickup-coil pair. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "White/Green"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "GND",
          "desc": "Other lead of the pickup-coil pair. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition HT coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "YAMAHA_YFM350_WARRIOR_DC": {
      "source_key": "YAMAHA_YFM350_WARRIOR_DC",
      "name": "ATV: Yamaha YFM350 Warrior (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "ATVs / 4-Wheelers",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for quad Yamaha YFM350 Warrior, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20YFM350%20Warrior.doc — first wiring table. OEM: +12V Brown; ground Black; pickup Blue and Yellow; coil Orange; engine stop Black/White. Clutch Black/Yellow, start-enable Yellow/Black, and neutral White/Black are documented as start-enable only (not block) and are not modeled. A second sealed-connector table with different pickup colors is stored as YAMAHA_YFM350_WARRIOR_SUMITOMO_DC.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "PULSE",
          "desc": "One lead of the pickup-coil pair. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "GND",
          "desc": "Other lead of the pickup-coil pair. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "YAMAHA_YFM350_WARRIOR_SUMITOMO_DC": {
      "source_key": "YAMAHA_YFM350_WARRIOR_SUMITOMO_DC",
      "name": "ATV: Yamaha YFM350 Warrior (sealed Sumitomo/Furukawa, DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "ATVs / 4-Wheelers",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for quad Yamaha YFM350 Warrior, second table ('version with sealed Sumitomo and Furukawa connectors'), read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20YFM350%20Warrior.doc — OEM: +12V Brown; ground Black; pickup White and Red; coil Orange; engine stop Black/White. Same start-enable-only clutch/neutral wires as the other Warrior table; not modeled as kill/block.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "PULSE",
          "desc": "One lead of the pickup-coil pair on the sealed-connector variant. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "White"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "GND",
          "desc": "Other lead of the pickup-coil pair on the sealed-connector variant. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "Red"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "GASGAS_EC125_AC": {
      "source_key": "GASGAS_EC125_AC",
      "name": "BIKE: Gas Gas EC125 (AC, 2-Stroke Enduro)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI-P' installation manual for Gas Gas EC125, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Gas%20Gas%20EC125%202004.doc — OEM: AC magneto Black/Red and Red/White; ground Black or Black/White; pickup Green / pickup return Red; coil White/Blue; kill Black/Yellow. DCCDI EC125 table matches these functions.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Magneto (AC)",
          "funcKey": "POWER",
          "desc": "AC power feed directly from the flywheel magneto lighting/charge coil; this is a battery-less ignition system.",
          "volt": "100V-200V AC",
          "colors": [
            "Black/Red",
            "Red/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black",
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the magneto pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "Red"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the handlebar kill button.",
          "volt": "N/A",
          "colors": [
            "Black/Yellow"
          ]
        }
      ]
    },
    "HONDA_CRF250_MORIWAKI_2009_DC": {
      "source_key": "HONDA_CRF250_MORIWAKI_2009_DC",
      "name": "BIKE: Honda CRF250 (Moriwaki 2009 SPARKER, DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI-P' mounting instructions for Moriwaki Honda CRF250 2009, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Moriwaki%20Honda%20CRF250%202009.doc — this is the Moriwaki/IgniTech SPARKER install, not a claim that every stock CRF250 uses these colors. OEM: +12V Blue (from power switch; doc also notes Brown from ignition key as a 12V source); ground Green/Black; pickup Blue/Yellow / pickup return Green/White; coil Black/Yellow; kill Black/White. SPARKER tach and gear-shift outputs have no OEM wire colors, so those functions are left unused.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power",
          "funcKey": "POWER",
          "desc": "12V DC supply documented from the power switch (Blue). The same manual also notes Brown from the ignition key as a 12V source.",
          "volt": "12V DC",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Green/Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the kill switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "HONDA_NX250_DOMINATOR_DC": {
      "source_key": "HONDA_NX250_DOMINATOR_DC",
      "name": "BIKE: Honda NX250 Dominator (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-small",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Honda NX250 Dominator, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Honda%20NX250%20Dominator.doc — OEM: +12V Black/White; ground Green; pickup Blue/Yellow; coil Black/Yellow. Kill-switch and tachometer wire colors are not in this table, so those functions are left unused rather than guessed.",
      "provenance": "verified",
      "pins": 4,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM kill-switch wire color — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM tachometer wire color — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "HONDA_MTX125_DC": {
      "source_key": "HONDA_MTX125_DC",
      "name": "BIKE: Honda MTX125 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Honda MTX125, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Honda%20MTX125.doc — OEM: +12V Black (from ignition key); ground Green; pickup Blue/Yellow / pickup return Green/White; coil Black/Yellow; engine stop Black/White.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply. Source says connect SPARKER red to the Black wire from the ignition switch.",
          "volt": "12V DC",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "HONDA_SL230_DC": {
      "source_key": "HONDA_SL230_DC",
      "name": "BIKE: Honda SL230 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-small",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Honda SL230, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Honda%20SL230.doc — OEM: +12V Black/White; ground Green; pickup Blue/Yellow; coil Black/Yellow. Sidestand blocking Green/White is documented but is not a kill switch and is not modeled. No OEM kill/tach colors in this table.",
      "provenance": "verified",
      "pins": 4,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM kill-switch wire color — sidestand Green/White is a blocking input, not modeled as KILL.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM tachometer wire color — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "KAWASAKI_KLR650_DC": {
      "source_key": "KAWASAKI_KLR650_DC",
      "name": "BIKE: Kawasaki KLR650 (DC SPARKER install)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Kawasaki KLR650, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Kawasaki%20KLR650.doc — this is the DC SPARKER replacement wiring, not the older unverified AC profile. OEM: +12V Brown/White; ground Black/Yellow; pickup Black (2-pin connector) / sensor ground Black/Red; coil Black (6-pin connector); engine stop Black/White. Magneto Red is listed with the SPARKER green pair and is not modeled as DC power. Blocking Red/Black is not modeled.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Brown/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground from the key-switch circuit.",
          "volt": "0V",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "CKPS lead in the 2-pin connector.",
          "volt": "Low AC",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Black/Red"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil (6-pin connector).",
          "volt": "400V peak",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Engine stop switch wire listed with the magneto pair.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "KAWASAKI_KLX650C_DC": {
      "source_key": "KAWASAKI_KLX650C_DC",
      "name": "BIKE: Kawasaki KLX650C (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Kawasaki KLX650C, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Kawasaki%20KLX650C.doc — OEM: +12V Brown (from ignition switch); ground Black/Yellow; pickup White/Yellow / sensor ground Green/White; coil Black; engine stop / magneto pair Red and Black/White. Blocking Black/Red is not modeled.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply from the ignition switch.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop / Magneto Pair",
          "funcKey": "KILL",
          "desc": "Source lists Red and Black/White together as magneto coil / engine stop switch wires on the SPARKER green input.",
          "volt": "N/A",
          "colors": [
            "Red",
            "Black/White"
          ]
        }
      ]
    },
    "KAWASAKI_KLX650R_DC": {
      "source_key": "KAWASAKI_KLX650R_DC",
      "name": "BIKE: Kawasaki KLX650R (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Kawasaki KLX650R, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Kawasaki%20KLX650R.doc — OEM: +12V Yellow (from light switch); ground Black/Yellow; pickup White/Yellow / sensor ground Green/White; coil Blue; engine stop Black/White.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Light Switch)",
          "funcKey": "POWER",
          "desc": "12V DC supply documented from the light switch.",
          "volt": "12V DC",
          "colors": [
            "Yellow"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Magneto / engine stop switch wire.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "SUZUKI_DR350S_DC": {
      "source_key": "SUZUKI_DR350S_DC",
      "name": "BIKE: Suzuki DR350S (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Suzuki DR350S, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Suzuki%20DR350.doc — OEM: +12V Orange; ground Black/White; pickup Blue / sensor ground Green; coil White/Blue; engine stop Black/Yellow; tach White/Red. Sidestand Green/Red and neutral Blue/Red / Blue/Black are not modeled.",
      "provenance": "verified",
      "pins": 7,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 7,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Signal",
          "funcKey": "TACH",
          "desc": "Tachometer signal wire.",
          "volt": "Pulse",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 8,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "SUZUKI_DR500_DC": {
      "source_key": "SUZUKI_DR500_DC",
      "name": "BIKE: Suzuki DR500 (DC SPARKER; originally 6V)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Suzuki DR500, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Suzuki%20DR500.doc — OEM: +12V Orange (from ignition key); ground Black/White; pickup Orange / sensor ground Green; coil Black; engine stop Black/Yellow. Source states the bike is originally 6V and must be converted to 12V for this unit. AC magneto HV Brown and Grey are stator feeds, not modeled as SPARKER power.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched supply after converting the bike from original 6V to 12V as required by this SPARKER unit.",
          "volt": "12V DC",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil. Same OEM color Orange is also used for key-switched power on a different circuit.",
          "volt": "Low AC",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/Yellow"
          ]
        }
      ]
    },
    "SUZUKI_DR600_DC": {
      "source_key": "SUZUKI_DR600_DC",
      "name": "BIKE: Suzuki DR600 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Suzuki DR600, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Suzuki%20DR600.doc — OEM: +12V Orange (from ignition key); ground Black/White; pickup Orange / sensor ground Green; coil Black; engine stop Black/Yellow. AC magneto HV Black/Red and Black/White are stator feeds, not modeled as SPARKER power.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/Yellow"
          ]
        }
      ]
    },
    "SUZUKI_DR800_DC": {
      "source_key": "SUZUKI_DR800_DC",
      "name": "BIKE: Suzuki DR800 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Suzuki DR800, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Suzuki%20DR800.doc — OEM: +12V Orange (from ignition key); ground Black/White; pickup Blue/White / sensor ground Green; coil White/Blue; engine stop Black/Yellow; tach Black/Green. Sidestand Green / Green/Yellow (White) and neutral Blue / Blue/Black are not modeled.",
      "provenance": "verified",
      "pins": 7,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/White"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 7,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Signal",
          "funcKey": "TACH",
          "desc": "Tachometer signal wire.",
          "volt": "Pulse",
          "colors": [
            "Black/Green"
          ]
        },
        {
          "pin": 8,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_DT125R_3MB_DC": {
      "source_key": "YAMAHA_DT125R_3MB_DC",
      "name": "BIKE: Yamaha DT125R 3MB-00 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Yamaha DT125R 3MB-00, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20DT125R%203MB-00.doc — OEM: +12V Brown (from ignition key); ground Black; pickup White/Red / sensor ground Black; coil Orange; kill Black/White. Neutral Blue/Yellow, sidestand Blue, and YPVS/kill Black/Yellow are not modeled.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil. Same OEM color Black as chassis ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the kill switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "YAMAHA_DT125R_4BL_DC": {
      "source_key": "YAMAHA_DT125R_4BL_DC",
      "name": "BIKE: Yamaha DT125R 4BL (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Yamaha DT125R 4BL, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20DT125R%204BL.doc — OEM: +12V Brown (from ignition key); ground Black; pickup White/Red / sensor ground Black; coil Orange; kill Black/White. Neutral Light Blue / Blue, sidestand Blue/Yellow, and YPVS/kill Black/Yellow are not modeled. Core POWER/GND/PULSE/COIL/KILL colors match the 3MB-00 table; the year-code difference is in unmodeled blocking/YPVS wires.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil. Same OEM color Black as chassis ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the kill switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "YAMAHA_DT200R_DC": {
      "source_key": "YAMAHA_DT200R_DC",
      "name": "BIKE: Yamaha DT200R (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Yamaha DT200R, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20DT200R.doc — OEM: ground Black; pickup White/Red / sensor ground White/Green; coil Orange; kill Black/White. The +12V row lists only the SPARKER red wire with no OEM color, so POWER is left unused rather than guessed. YPVS Black/Yellow is not modeled.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No OEM +12V wire color in the source table (SPARKER red is the unit wire). Not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "White/Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the kill switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "YAMAHA_TT600R_DC": {
      "source_key": "YAMAHA_TT600R_DC",
      "name": "BIKE: Yamaha TT600R (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Yamaha TT600R, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20TT600R.doc — OEM: +12V Red/White; ground Black; pickup Green/White; coil Orange; engine stop Red/Black. Blocking Blue/White is not modeled. No separate pickup-return color is listed.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Red/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil. Source table does not list a separate pickup-return color.",
          "volt": "Low AC",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 5,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Engine stop switch wire.",
          "volt": "N/A",
          "colors": [
            "Red/Black"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No additional documented OEM function for this slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_TW200_DC": {
      "source_key": "YAMAHA_TW200_DC",
      "name": "BIKE: Yamaha TW200 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Yamaha TW200, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20TW200.doc — OEM: ground Black; pickup White and Green; coil Orange; kill Black/White. The +12V row lists only the SPARKER red wire with no OEM color, so POWER is left unused. Clutch Blue and sidestand Blue/Yellow are not modeled.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No OEM +12V wire color in the source table (SPARKER red is the unit wire). Not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "PULSE",
          "desc": "One CKPS lead. Source table labels both White and Green as CKPS without stating polarity.",
          "volt": "Low AC",
          "colors": [
            "White"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "GND",
          "desc": "Other CKPS lead. Source table labels both White and Green as CKPS without stating polarity.",
          "volt": "Low AC",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the kill switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "YAMAHA_XT125_DC": {
      "source_key": "YAMAHA_XT125_DC",
      "name": "BIKE: Yamaha XT125 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Yamaha XT125, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20XT125.doc — OEM: ground Black; pickup White / sensor ground Green; coil Orange; engine stop Black/White. The +12V row lists only the SPARKER red wire with no OEM color, so POWER is left unused. Source says residual Red and Brown wires must not be connected.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No OEM +12V wire color in the source table. Residual Red and Brown wires are explicitly do-not-connect.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "YAMAHA_XT350_DC": {
      "source_key": "YAMAHA_XT350_DC",
      "name": "BIKE: Yamaha XT350 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Yamaha XT350, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20XT350.doc — OEM: ground Black; pickup White/Red / sensor ground Black; coil Orange; engine stop Black/White. The +12V row lists only the SPARKER red wire with no OEM color, so POWER is left unused.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No OEM +12V wire color in the source table (SPARKER red is the unit wire). Not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil. Same OEM color Black as chassis ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "YAMAHA_XT600_1984_86_DC": {
      "source_key": "YAMAHA_XT600_1984_86_DC",
      "name": "BIKE: Yamaha XT600 1984-86 / XT600Z Tenere 1983-85 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech SPARKER manuals for Yamaha XT600, read directly 2026-09-06 from https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20XT600%202snimace.doc and https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Yamaha%20XT600.doc — variant table XT600 (1984-86), XT600Z Tenere (1983-85). OEM: pickup CKPS1 White/Red, CKPS2 White/Green, CKPS ground Green; chassis ground Black; coil Orange; engine stop Black/White. +12V Brown is taken from the DCCDIP header note 'brown from ignition key' (year tables list SPARKER red without repeating the OEM color).",
      "provenance": "verified",
      "pins": 7,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply. OEM Brown is from the DCCDIP header note.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE 1",
          "active": true,
          "role": "Pickup Coil CKPS 1",
          "funcKey": "PULSE",
          "desc": "First pickup (CKPS 1).",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil CKPS 2",
          "funcKey": "PULSE_AUX",
          "desc": "Second pickup (CKPS 2).",
          "volt": "Low AC",
          "colors": [
            "White/Green"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE GND",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Ground for the CKPS pair.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 6,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 7,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 8,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_XT600_1987_DC": {
      "source_key": "YAMAHA_XT600_1987_DC",
      "name": "BIKE: Yamaha XT600 from 1987 (sidestand, DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech SPARKER manuals for Yamaha XT600, read directly 2026-09-06 from https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20XT600%202snimace.doc and https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Yamaha%20XT600.doc — variant table XT600 with side stand (from 1987). OEM: pickup CKPS1 Blue/Yellow, CKPS2 Green/White, CKPS ground Black/Yellow; chassis ground Black; coil Orange; engine stop Black/White. +12V Brown from the DCCDIP header note. Neutral Light Blue / Blue and sidestand Blue/Yellow are blocking inputs, not modeled.",
      "provenance": "verified",
      "pins": 7,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply. OEM Brown is from the DCCDIP header note.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE 1",
          "active": true,
          "role": "Pickup Coil CKPS 1",
          "funcKey": "PULSE",
          "desc": "First pickup (CKPS 1).",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil CKPS 2",
          "funcKey": "PULSE_AUX",
          "desc": "Second pickup (CKPS 2).",
          "volt": "Low AC",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE GND",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Ground for the CKPS pair.",
          "volt": "0V",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 7,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 8,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_XT600Z_1986_87_DC": {
      "source_key": "YAMAHA_XT600Z_1986_87_DC",
      "name": "BIKE: Yamaha XT600Z Tenere with starter 1986-87 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech SPARKER manuals for Yamaha XT600, read directly 2026-09-06 from https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20XT600%202snimace.doc and https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Yamaha%20XT600.doc — variant table XT600Z Tenere with starter (1986-87). OEM: pickup CKPS1 Red, CKPS2 Green/White, CKPS ground Green; chassis ground Black; coil Orange; engine stop Black/White. +12V Brown from the DCCDIP header note. Blocking Blue and Blue/Yellow are not modeled.",
      "provenance": "verified",
      "pins": 7,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply. OEM Brown is from the DCCDIP header note.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE 1",
          "active": true,
          "role": "Pickup Coil CKPS 1",
          "funcKey": "PULSE",
          "desc": "First pickup (CKPS 1).",
          "volt": "Low AC",
          "colors": [
            "Red"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil CKPS 2",
          "funcKey": "PULSE_AUX",
          "desc": "Second pickup (CKPS 2).",
          "volt": "Low AC",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE GND",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Ground for the CKPS pair.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 6,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 7,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 8,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_XT600Z_1988_DC": {
      "source_key": "YAMAHA_XT600Z_1988_DC",
      "name": "BIKE: Yamaha XT600Z(U) Tenere with starter from 1988 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech SPARKER manuals for Yamaha XT600, read directly 2026-09-06 from https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20XT600%202snimace.doc and https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Yamaha%20XT600.doc — variant table XT600Z (U) Tenere with starter (from 1988). OEM: pickup CKPS1 Blue/Yellow, CKPS2 Green/White, CKPS ground Black/Yellow; chassis ground Black; coil Orange; engine stop Black/White. +12V Brown from the DCCDIP header note. Blocking Blue and Blue/Yellow are not modeled.",
      "provenance": "verified",
      "pins": 7,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply. OEM Brown is from the DCCDIP header note.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE 1",
          "active": true,
          "role": "Pickup Coil CKPS 1",
          "funcKey": "PULSE",
          "desc": "First pickup (CKPS 1).",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil CKPS 2",
          "funcKey": "PULSE_AUX",
          "desc": "Second pickup (CKPS 2).",
          "volt": "Low AC",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE GND",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Ground for the CKPS pair.",
          "volt": "0V",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 7,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 8,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "KTM_640_LC4_1998_2002_DC": {
      "source_key": "KTM_640_LC4_1998_2002_DC",
      "name": "BIKE: KTM 640 LC4 1998-2002 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for KTM640 LC4 1998-2002, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/KTM640%20LC4%201998-2002.doc — OEM: +12V Orange; grounds Black (terminal ring) and Brown (harness); pickup White (+) / Green (-); coil White/Blue. No kill-switch or tachometer OEM color is listed, so those functions are left unused.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power",
          "funcKey": "POWER",
          "desc": "12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground. Source lists Black (terminal ring) and Brown (harness) as grounds.",
          "volt": "0V",
          "colors": [
            "Black",
            "Brown"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal (+)",
          "funcKey": "PULSE",
          "desc": "Pickup positive.",
          "volt": "Low AC",
          "colors": [
            "White"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Signal (-)",
          "funcKey": "GND",
          "desc": "Pickup negative.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM kill-switch wire color — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "HUSQVARNA_LT610_DC": {
      "source_key": "HUSQVARNA_LT610_DC",
      "name": "BIKE: Husqvarna LT610 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Husqvarna LT610, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Husquarna%20LT610.doc — motorbike-column OEM colors: +12V Green/Red; ground Blue; pickup Green and White; coil Brown/White; kill Orange/White; tach Green/Grey. Original-unit column colors (Black/White ground, White/Blue coil, Black/Yellow kill, Blue tach) are the stock CDI side and are not used as this SPARKER-install pinout.",
      "provenance": "verified",
      "pins": 7,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Green/Red"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground (motorbike column).",
          "volt": "0V",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "PULSE",
          "desc": "One pickup lead. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "GND",
          "desc": "Other pickup lead. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "White"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil.",
          "volt": "400V peak",
          "colors": [
            "Brown/White"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Kill switch wire (motorbike column).",
          "volt": "N/A",
          "colors": [
            "Orange/White"
          ]
        },
        {
          "pin": 7,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Signal",
          "funcKey": "TACH",
          "desc": "Tachometer signal wire (motorbike column).",
          "volt": "Pulse",
          "colors": [
            "Green/Grey"
          ]
        },
        {
          "pin": 8,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "TM600_DC": {
      "source_key": "TM600_DC",
      "name": "BIKE: TM 600 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI-P' mounting instructions for TM600, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/TM600.doc — OEM: +12V Blue; grounds Black and Black/Yellow; pickup White / pickup return Green; coil Sky Blue. No kill-switch or tachometer OEM color is listed, so those functions are left unused.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power",
          "funcKey": "POWER",
          "desc": "12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground. Source lists Black and Black/Yellow.",
          "volt": "0V",
          "colors": [
            "Black",
            "Black/Yellow"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Return/ground leg of the pickup coil circuit.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Sky Blue"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM kill-switch wire color — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "HUSABERG_FE650_SEM_DC": {
      "source_key": "HUSABERG_FE650_SEM_DC",
      "name": "BIKE: Husaberg FE650 SEM (DC, partial OEM colors)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-small",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech SPARKER manuals for Husaberg FE650 with SEM ignition, read directly 2026-09-06 from https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Husaberg%20FE650%20(SEM).doc and https://www.ignitech.cz/zdroj/en/vyrobky/dccdip/manual/Husaberg%20FE650%20SEM.doc — OEM colors documented: pickup Green; ground Black (from magneto); kill Orange. +12V and coil rows list SPARKER unit-wire colors only, with no OEM bike colors, so POWER and COIL are left unused rather than guessed.",
      "provenance": "verified",
      "pins": 3,
      "slots": [
        {
          "pin": 1,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Ground from the magneto / SPARKER ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 2,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the magneto pickup.",
          "volt": "Low AC",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Kill switch wire.",
          "volt": "N/A",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 4,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No OEM +12V wire color in the source tables — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 5,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No OEM coil wire color in the source tables — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM tachometer wire color — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "HONDA_TRX450_ICM_DC": {
      "source_key": "HONDA_TRX450_ICM_DC",
      "name": "ATV: Honda TRX450 Foreman/Sportrax ICM (DC, partial OEM colors)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-small",
      "category": "ATVs / 4-Wheelers",
      "source": "Honda 1998-2004 TRX450 Foreman/Sportrax factory service manual (covers TRX450S/ES/FM/FE), Section 18 'IGNITION SYSTEM' inspection procedures, read directly 2026-09-06 from a scanned copy: https://archive.org/details/1998-2004-foreman-450-service-manual — Section 18-4/18-5 'IGNITION COIL PRIMARY PEAK VOLTAGE' and 'IGNITION PULSE GENERATOR PEAK VOLTAGE' procedures explicitly state wire color together with function (not diagram-traced): coil primary test connects 'Black/Yellow terminal (-) - Body ground (+)'; pulse generator test connects 'Blue/Yellow terminal (+) - Green/White (-)' at the ICM's 4P connector. The 4P connector's remaining wire (Yellow) is confirmed by the Section 18-3 troubleshooting chart and Section 18-6 'AC SENSOR LINE INSPECTION' to be a continuity-check reference line to the alternator's 5P connector, not one of this app's modeled functions, so it is left unused. The ICM also has a separate 2P connector which the same troubleshooting chart confirms carries the ICM's switched power and a distinct 'ground wire of the ICM' — but this session could not read the exact wire colors for those two functions with confidence: the wiring-diagram scan (same manual, Section 23) is legible enough to show one wire is clearly 'Black/White', but the second wire's color could not be resolved even after repeated high-resolution re-crops, an OCR attempt (unavailable in this environment), and checking an alternate manual copy at manualslib.com/manual/1116593 (same underlying scan quality). An initial candidate reading of 'Light green/Red' for that second wire was checked against the manual's own text and found to actually belong to a different circuit (the neutral/reverse switch, Section 21), so it was discarded rather than published. POWER and GND are left unused rather than guessed; KILL and TACH have no documented wire in the sections read.",
      "provenance": "unverified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "ICM 2P connector confirmed (by troubleshooting text) to carry switched 12V power, but the exact OEM wire color could not be read with confidence from the available scan — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 2,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "ICM 2P connector confirmed (by troubleshooting text) to carry a distinct ICM ground wire, but the exact OEM wire color could not be read with confidence from the available scan — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 3,
          "label": "AC SNS",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Yellow wire on the ICM 4P connector — confirmed to be an AC/alternator reference line (continuity-checked against the alternator's 5P connector), not a POWER/GND/PULSE/COIL/KILL/TACH function this app models.",
          "volt": "--",
          "colors": [
            "Yellow (not modeled)"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Ignition coil primary trigger, confirmed via factory peak-voltage test procedure (connect Black/Yellow to body ground, crank engine, read peak voltage; spec 100V minimum).",
          "volt": "100V+ peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal (+)",
          "funcKey": "PULSE",
          "desc": "Ignition pulse generator signal, confirmed via factory peak-voltage test procedure (connect Blue/Yellow (+) to Green/White (-) at the ICM 4P connector; spec 0.7V minimum).",
          "volt": "0.7V+ peak",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Return (-)",
          "funcKey": "GND",
          "desc": "Ignition pulse generator return leg, confirmed via the same factory peak-voltage test procedure as PULSE+ (paired connection).",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        }
      ]
    },
    "LONCIN_ATV300_DC": {
      "source_key": "LONCIN_ATV300_DC",
      "name": "ATV: Loncin ATV300 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "ATVs / 4-Wheelers",
      "source": "IgniTech 'SPARKER TCI' mounting instructions for Loncin ATV300, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/tci/manual/Loncin%20ATV300.doc — motorbike-column OEM: +12V Red; ground Green; pickup Blue/White / sensor ground Green/White; coil Black/Yellow. No kill-switch OEM color is listed, so KILL is left unused.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Red"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/White"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM kill-switch wire color — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "HONDA_XL600_ESTART_DC": {
      "source_key": "HONDA_XL600_ESTART_DC",
      "name": "BIKE: Honda XL600 with electric starter (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Honda XL600 with starter, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Honda%20XL600%20se%20starterem.doc — OEM: +12V Black (from ignition key); ground Green; pickup Blue/Yellow; coil Black/Yellow; engine stop Black/White. Stator coil Black/Red is not modeled as DC power. This is a different harness from the kickstart XL600 profile.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply from the ignition key.",
          "volt": "12V DC",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Stator coil Black/Red is documented but is not the SPARKER 12V feed — not modeled as POWER.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "HONDA_XLV600_DC": {
      "source_key": "HONDA_XLV600_DC",
      "name": "BIKE: Honda XLV600 Transalp (DC, two coils)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Honda XLV600, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Honda%20XLV600.doc — OEM harness colors marked 'both join': +12V Black/White; ground Green; CKPS 1 Blue; CKPS 2 Yellow; coil 1 Black/Yellow; coil 2 Black/Blue. Sidestand blocking Green/Yellow is not modeled as KILL.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply (both cylinder units join this wire).",
          "volt": "12V DC",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground (both cylinder units join this wire).",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE 1",
          "active": true,
          "role": "Pickup Coil CKPS 1",
          "funcKey": "PULSE",
          "desc": "Cylinder-1 pickup.",
          "volt": "Low AC",
          "colors": [
            "Blue"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil CKPS 2",
          "funcKey": "PULSE_AUX",
          "desc": "Cylinder-2 pickup.",
          "volt": "Low AC",
          "colors": [
            "Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "COIL 1",
          "active": true,
          "role": "Ignition Coil Output 1",
          "funcKey": "COIL",
          "desc": "Trigger to induction coil 1.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "COIL 2",
          "active": true,
          "role": "Ignition Coil Output 2",
          "funcKey": "COIL_AUX",
          "desc": "Trigger to induction coil 2.",
          "volt": "400V peak",
          "colors": [
            "Black/Blue"
          ]
        },
        {
          "pin": 7,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Blocking Green/Yellow is sidestand interlock, not modeled as KILL.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 8,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_TW125_DC": {
      "source_key": "YAMAHA_TW125_DC",
      "name": "BIKE: Yamaha TW125 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Yamaha TW125, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20TW125.doc — OEM: ground Black; pickup White/Red and White/Blue; coil Orange. The +12V row lists only the SPARKER red wire with no OEM color, so POWER is left unused. Stator Black/Red and Green/White are not modeled as DC power. Clutch Blue/Yellow is not modeled.",
      "provenance": "verified",
      "pins": 4,
      "slots": [
        {
          "pin": 1,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No OEM +12V wire color in the source table (SPARKER red is the unit wire). Not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "PULSE",
          "desc": "One pickup lead. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE 2",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "GND",
          "desc": "Other pickup lead. Source table does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the ignition coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No documented OEM kill-switch wire color — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_TDR125_DC": {
      "source_key": "YAMAHA_TDR125_DC",
      "name": "BIKE: Yamaha TDR125 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Yamaha TDR 125, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Yamaha%20TDR%20125.doc — OEM: +12V Brown (from ignition key); ground Black; pickup White/Blue / sensor ground White/Red; coil Orange; kill Black/White. Neutral Blue/White, sidestand Blue/Yellow, and YPVS Black/Yellow are not modeled.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the kill switch.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        }
      ]
    },
    "SUZUKI_DR650_1994_ESTART_DC": {
      "source_key": "SUZUKI_DR650_1994_ESTART_DC",
      "name": "BIKE: Suzuki DR650 1994 with electric starter (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-8",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER DC-CDI' mounting instructions for Suzuki DR650 1994 (with el. starter), read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/dccdi/manual/Suzuki%20DR650%201994%20(with%20el.%20starter).doc — OEM: +12V Orange; ground Black/White; pickup Blue/White / sensor ground Green; coil White/Blue (2x); engine stop Black/Yellow; tach Black/Green. Sidestand and neutral are not modeled. Different harness from the kickstart DR650 profile.",
      "provenance": "verified",
      "pins": 7,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main ground.",
          "volt": "0V",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/White"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil (source lists two White/Blue coil wires).",
          "volt": "400V peak",
          "colors": [
            "White/Blue"
          ]
        },
        {
          "pin": 6,
          "label": "KILL",
          "active": true,
          "role": "Engine Stop Switch",
          "funcKey": "KILL",
          "desc": "Grounds to stop the engine via the engine stop switch.",
          "volt": "N/A",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 7,
          "label": "TACH",
          "active": true,
          "role": "Tachometer Signal",
          "funcKey": "TACH",
          "desc": "Tachometer signal wire.",
          "volt": "Pulse",
          "colors": [
            "Black/Green"
          ]
        },
        {
          "pin": 8,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_TT600_TCI_DC": {
      "source_key": "YAMAHA_TT600_TCI_DC",
      "name": "BIKE: Yamaha TT600 (TCI SPARKER, DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER TCI' mounting instructions for Yamaha TT600, read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/tci/manual/Yamaha%20TT600.doc — OEM: +12V White/Red; ground Black; pickup Yellow/Blue / sensor ground Green/White; coil Orange. Blocking Black/White is not modeled as KILL. Different table from the TT600R DC-CDI profile.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Yellow/Blue"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Blocking Black/White is not modeled as KILL.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_XT600E_1990_95_DC": {
      "source_key": "YAMAHA_XT600E_1990_95_DC",
      "name": "BIKE: Yamaha XT600E 1990-95 (DC)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid",
      "category": "Dirt Bikes / Dual-Sport",
      "source": "IgniTech 'SPARKER TCI' mounting instructions for Yamaha XT600E (1990-95), read directly from source .doc 2026-09-06: https://www.ignitech.cz/zdroj/en/vyrobky/tci/manual/Yamaha%20XT600E%2090-95.doc — OEM: +12V Red/White; ground Black; pickup Blue/Yellow / sensor ground Green/White; coil Orange. Blocking Black/White is not modeled as KILL. Different year/harness from the XT600 1984-88 carb tables.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "+12V",
          "active": true,
          "role": "Switched Power (Key)",
          "funcKey": "POWER",
          "desc": "Key-switched 12V DC supply.",
          "volt": "12V DC",
          "colors": [
            "Red/White"
          ]
        },
        {
          "pin": 2,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Main chassis/engine ground.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Timing signal from the pickup coil.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Ground",
          "funcKey": "GND",
          "desc": "Sensor ground for the pickup coil.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Trigger output to the induction coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Blocking Black/White is not modeled as KILL.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_YFZ350_BANSHEE_AC": {
      "source_key": "YAMAHA_YFZ350_BANSHEE_AC",
      "name": "ATV: Yamaha YFZ350 Banshee 2002 (AC-CDI magneto)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "ATVs / 4-Wheelers",
      "source": "Yamaha YFZ350(P) 2002 Supplementary Service Manual 3GG-AE2 (use with YFZ350T SM 2GU-28197-20), electrical specifications and cable-routing pages read 2026-09-06 from the published OCR at https://manualmachine.com/yamaha/yfz350/7622980-user-manual/ — Yamaha prints C.D.I. magneto pickup White/Red–White/Green (94–140 Ω); charging coil (CDI source) Green–Red (13.7–20.5 Ω); lighting coil Yellow–Black (not an ignition feed); ignition coil leads Orange and Black. The 2002 wiring-diagram OCR is not clear enough to assign a CDI kill-switch color, so KILL is left unused. Forum/blog kill-wire claims were not used.",
      "provenance": "verified",
      "pins": 5,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Charging Coil",
          "funcKey": "POWER",
          "desc": "Yamaha names this the C.D.I. charging coil pair (Green–Red). The supplementary SM prints the pair, not which CDI pin is which, so both colors are listed on this function.",
          "volt": "AC (magneto source)",
          "colors": [
            "Green",
            "Red"
          ]
        },
        {
          "pin": 2,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "PULSE",
          "desc": "Pickup coil pair printed as White/Red–White/Green. Tester polarity is not labeled in the spec table.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Lead",
          "funcKey": "GND",
          "desc": "Other pickup-coil lead from the same White/Red–White/Green pair.",
          "volt": "Low AC",
          "colors": [
            "White/Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Cable-routing page labels the ignition coil lead Orange.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 5,
          "label": "COIL GND",
          "active": true,
          "role": "Ignition Coil Return",
          "funcKey": "GND",
          "desc": "Cable-routing page labels the other ignition coil lead Black.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "No Yamaha text in the 2002 supplementary SM names a CDI kill-switch color — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "YAMAHA_YFM450_KODIAK_2005_DC": {
      "source_key": "YAMAHA_YFM450_KODIAK_2005_DC",
      "name": "ATV: Yamaha YFM450 Kodiak 2005 (DC-CDI, partial OEM colors)",
      "system": "DC",
      "colorClass": "active-dc",
      "gridClass": "connector-grid-small",
      "category": "ATVs / 4-Wheelers",
      "source": "Yamaha 2005 YFM450 Kodiak factory service manual (LIT-11616-18-32 / archive.org identifier manualzilla-id-6002731), Chapter 2 electrical specs and Chapter 9 ignition troubleshooting, read 2026-09-06 from https://archive.org/stream/manualzilla-id-6002731/6002731_djvu.txt — Yamaha prints D.C. C.D.I.; pickup White/Red–White/Green (459–561 Ω) with tester (+) White/Red and (–) White/Green at the AC magneto coupler; ignition coil primary tester (+) Orange lead terminal to coil base. Main-switch / engine-stop / CDI +12V / CDI ground colors sit only on OCR-broken switch charts and the wiring diagram, so POWER, GND, and KILL are left unused rather than guessed.",
      "provenance": "unverified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "This is a battery DC-CDI (Yamaha: D.C. C.D.I.), but the CDI +12V wire color was not readable from the switch/diagram OCR — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 2,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "CDI ground wire color was not readable from the switch/diagram OCR — not modeled to avoid guessing.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal (+)",
          "funcKey": "PULSE",
          "desc": "Pickup coil tester (+) White/Red at the AC magneto coupler.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 4,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Return (-)",
          "funcKey": "GND",
          "desc": "Pickup coil tester (–) White/Green at the AC magneto coupler.",
          "volt": "0V",
          "colors": [
            "White/Green"
          ]
        },
        {
          "pin": 5,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Ignition coil primary tester (+) Orange lead terminal.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Engine-stop switch is part of the ignition troubleshooting path, but its CDI wire color was not readable from the OCR switch chart — not modeled.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "POLARIS_INDY440_500_1996_98_AC": {
      "source_key": "POLARIS_INDY440_500_1996_98_AC",
      "name": "SLED: Polaris Indy 440/500 1996-98 (AC, EC44/EC50 stator-to-CDI)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid-small",
      "category": "Snowmobiles / Sleds",
      "source": "Polaris 1996-1998 snowmobile electrical service manual Chapter 10 (publication used by vintagesnow.com as 96-98_Electrical_SM.pdf), read 2026-09-06 from https://vintagesnow.com/Polaris_files/96-98_Electrical_SM.pdf — page 10.3 coil-resistance chart for 1996 EC44PM and EC50PM (Indy 440 / Indy 500 family): exciter Brown/White to Black/Red, 164 Ω; no separate trigger coil listed; lighting Yellow to Yellow/Red is not the ignition feed. Page 10.36 no-spark procedure: disconnect the single black (black/white) wire from the CDI module to the ignition kill circuit. Same page: on all except 3-cylinder engines the coil and CDI are one module, so a separate coil-trigger color is not printed. This does NOT match the older unverified POLARIS_INDY500_AC record; that record was left unchanged.",
      "provenance": "verified",
      "pins": 2,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Exciter Coil",
          "funcKey": "POWER",
          "desc": "Stator exciter pair Brown/White to Black/Red (164 Ω). The chart prints the pair, not which CDI pin is which.",
          "volt": "AC (exciter)",
          "colors": [
            "Brown/White",
            "Black/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Single black (black/white) wire from the CDI module to the ignition kill circuit. Disconnecting it isolates the kill path.",
          "volt": "N/A",
          "colors": [
            "Black",
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "1996 EC44PM/EC50PM chart lists no separate trigger coil — PULSE left unused.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 4,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Non-3-cylinder coil is integral to the CDI module — no separate coil-trigger color printed.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 5,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "POLARIS_INDY_XLT_1996_98_AC": {
      "source_key": "POLARIS_INDY_XLT_1996_98_AC",
      "name": "SLED: Polaris Indy XLT 1996-98 (AC, EC58 3-cyl stator-to-CDI)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid-small",
      "category": "Snowmobiles / Sleds",
      "source": "Polaris 1996-1998 snowmobile electrical service manual Chapter 10, read 2026-09-07 from https://vintagesnow.com/Polaris_files/96-98_Electrical_SM.pdf — page 10.3 1996 chart for EC58PL-02/03/07 (Indy XLT family): exciter Black/Red to Red, 4.6 Ω; trigger White to White/Red, 100 Ω; lighting Yellow to Yellow/Red is not the ignition feed. Page 10.36: kill is the single black (black/white) CDI wire; 3-cylinder engines have a separate secondary coil, but this chapter does not print a primary coil-trigger color, so COIL is left unused. Different stator pair from the 2-cyl Indy 440/500 EC44/EC50 chart.",
      "provenance": "verified",
      "pins": 3,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Exciter Coil",
          "funcKey": "POWER",
          "desc": "Stator exciter pair Black/Red to Red (4.6 Ω). The chart prints the pair, not which CDI pin is which.",
          "volt": "AC (exciter)",
          "colors": [
            "Black/Red",
            "Red"
          ]
        },
        {
          "pin": 2,
          "label": "PULSE+",
          "active": true,
          "role": "Trigger Coil Lead",
          "funcKey": "PULSE",
          "desc": "Trigger pair White to White/Red (100 Ω). Chart does not label polarity.",
          "volt": "Low AC",
          "colors": [
            "White"
          ]
        },
        {
          "pin": 3,
          "label": "PULSE-",
          "active": true,
          "role": "Trigger Coil Lead",
          "funcKey": "GND",
          "desc": "Other trigger-coil lead from the same White to White/Red pair.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 4,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Single black (black/white) wire from the CDI module to the ignition kill circuit.",
          "volt": "N/A",
          "colors": [
            "Black",
            "Black/White"
          ]
        },
        {
          "pin": 5,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "3-cylinder secondary coil is separate, but no primary coil-trigger color is printed on page 10.3 — not modeled.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 6,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Unused/empty pin slot.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        }
      ]
    },
    "HONDA_ATC200X_8385_AC": {
      "source_key": "HONDA_ATC200X_8385_AC",
      "name": "3-WHEELER: Honda ATC200X 1983-85 (AC-CDI, CF420)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "3-Wheelers / ATCs",
      "source": "Honda ATC200X '83-'85 Shop Manual (official Honda Motor Co., Ltd., Date of Issue: July, 1984; cover years 1983-1985), Chapter 16 ELECTRICAL SYSTEM, read 2026-09-07 from the published scan at http://www.oscarmayer.net/atc/manuals/honda/atc200x_83-85_servicemanual.pdf — page 16-3: exciter coil Black/Red to body ground, 100–400 Ω (AC magneto feed); lighting coil is Yellow and is not the CDI feed. Page 16-4: CDI unit marked CF420; harness colors Black, Black/Red, Green, Green, Blue/Yellow, Black/Yellow (two connectors: 2-pin + 4-pin). Page 16-5: pulse generator Blue/Yellow to Green, 30–200 Ω (1983) / 50–150 Ω (after 1983). Page 16-7: engine-stop switch OFF = continuity Black to Green (ground-to-kill). Page 16-8 wiring diagram: Black = engine-stop IG; Black/Red = alternator exciter to CDI; Green = ground; Black/Yellow = ignition coil; Blue/Yellow = pulse generator. Same six colors on 1983 and after-1983 CDI resistance tables; those tables differ only in kΩ ranges.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Exciter Coil",
          "funcKey": "POWER",
          "desc": "Honda names the exciter coil Black/Red to body ground (100–400 Ω). This is the AC magneto feed into the CDI.",
          "volt": "AC (exciter)",
          "colors": [
            "Black/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Engine-stop switch IG is Black. OFF shorts Black to Green (ground-to-kill).",
          "volt": "N/A",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Honda prints Green as the common ground on the wiring diagram and on the CDI harness (two Green terminals).",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Wiring diagram 16-8 routes Black/Yellow from the CDI to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pulse Generator Signal",
          "funcKey": "PULSE",
          "desc": "Pulse generator is tested Blue/Yellow to Green. Blue/Yellow is the pulse lead into the CDI.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pulse Generator Return",
          "funcKey": "GND",
          "desc": "Pulse-generator return is Green (same printed color as chassis ground). Honda measures the pulse coil Blue/Yellow–Green.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        }
      ]
    },
    "HONDA_ATC250ES_8587_AC": {
      "source_key": "HONDA_ATC250ES_8587_AC",
      "name": "3-WHEELER: Honda ATC250ES Big Red 1985-87 (AC-CDI)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "3-Wheelers / ATCs",
      "source": "Honda ATC250ES 85-87 Service Manual (official Honda Motor Co., Ltd., © 1986), Chapter 14 IGNITION SYSTEM, read 2026-09-07 from the published scan at http://www.oscarmayer.net/atc/manuals/honda/ATC250es-1985-1987service.pdf — page 14-1: CDI ignition with exciter coil 50–200 Ω and pulse generator 325 Ω ±10%. Page 14-3: at the pulse/exciter coupler, exciter is Black/Red to ground (50–200 Ω); pulse generator is Blue/Yellow to Green/White (325 Ω ±10%). Page 14-4 CDI terminal labels (same six colors on the 1985 one-plug housing and the after-1985 4-pin + 2-pin housing): IGN Black/Yellow; SW Black/White; EXT Black/Red; PC Blue/Yellow; NS Light Green/Red; E Green. NS is the neutral/start-enable circuit, not the engine-stop wire, so it is left unused. This is an AC magneto CDI (exciter EXT), not a battery-powered DC-CDI.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Exciter Coil",
          "funcKey": "POWER",
          "desc": "Honda labels this EXT. Exciter is tested Black/Red to ground (50–200 Ω).",
          "volt": "AC (exciter)",
          "colors": [
            "Black/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Honda labels this SW. Color is Black/White.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Honda labels this E. Color is Green.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Honda labels this IGN. Color is Black/Yellow.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pulse Generator Signal",
          "funcKey": "PULSE",
          "desc": "Honda labels this PC on the CDI. Color is Blue/Yellow. The stator pulse pair is Blue/Yellow–Green/White.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pulse Generator Return",
          "funcKey": "GND",
          "desc": "Honda measures the pulse coil Blue/Yellow to Green/White at the stator coupler. The CDI connector itself has no separate pulse-minus pin beyond E/Green.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        }
      ]
    },
    "YAMAHA_YTZ250_TRIZ_AC": {
      "source_key": "YAMAHA_YTZ250_TRIZ_AC",
      "name": "3-WHEELER: Yamaha YTZ250N Tri-Z 250 (AC-CDI magneto)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "3-Wheelers / ATCs",
      "source": "Yamaha YTZ250N Owner's Manual and Service (LIT-11626-04-40, 1st Edition April 1984, © 1984 Yamaha Motor Corporation, U.S.A.), read 2026-09-07 from the published scan at http://www.oscarmayer.net/atc/manuals/yamaha/tri-z_250_servicemanual.pdf — page 6-15 electrical specs: C.D.I. unit F8T07072 / Mitsubishi; pickup coil White/Red–Black 10.7 Ω ±10%; charging coil (CDI source) Brown–Black 315 Ω ±10%; lighting coil Yellow/Red–Black is not the ignition feed. Page 5-6: pickup test White/Red to Black 10.7 Ω ±10%; ignition coil primary 0.79 Ω ±15%. Page 5-7 lighting/ignition schematic: CDI coil output Orange; engine-stop OFF connects Black to Black/White (ground-to-kill).",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Charging Coil",
          "funcKey": "POWER",
          "desc": "Yamaha prints the C.D.I. charging-coil pair as Brown–Black (315 Ω ±10%). Brown is the source lead; Black is the common magneto return.",
          "volt": "AC (magneto source)",
          "colors": [
            "Brown"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Engine-stop switch OFF connects Black to Black/White (ground-to-kill).",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Black is the common magneto/chassis return on the pickup and charging-coil specs.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Lighting/ignition schematic page 5-7 routes Orange from the CDI to the ignition coil.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Pickup coil pair White/Red–Black (10.7 Ω ±10%). White/Red is the pulse lead.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Return",
          "funcKey": "GND",
          "desc": "Other pickup-coil lead is Black (same printed color as the charging-coil return).",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        }
      ]
    },
    "HONDA_ATC350X_8586_AC": {
      "source_key": "HONDA_ATC350X_8586_AC",
      "name": "3-WHEELER: Honda ATC350X 1985-86 (AC-CDI)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "3-Wheelers / ATCs",
      "source": "Honda 85-86 ATC 350X Service Manual (official Honda Motor Co., Ltd., © 1985), Chapter 16 ELECTRICAL SYSTEM, read 2026-09-07 from the published scan at http://www.oscarmayer.net/atc/manuals/honda/85-86_ATC350X_Service_Manual.pdf — page 16-3 ignition schematic: exciter Black/Red; pulse generator Blue/Yellow and Green/White; ignition coil Black/Yellow; engine-stop Black/White; common ground Green. Page 16-8: engine-stop switch OFF = continuity Black/White to Green (ground-to-kill). This is an AC magneto CDI (exciter), not a battery DC-CDI.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Exciter Coil",
          "funcKey": "POWER",
          "desc": "Ignition schematic routes Black/Red from the exciter coil into the CDI.",
          "volt": "AC (exciter)",
          "colors": [
            "Black/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Engine-stop is Black/White. OFF shorts Black/White to Green.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Honda prints Green as the common CDI/coil/exciter ground.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Ignition schematic routes Black/Yellow from the CDI to the coil primary.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pulse Generator Signal",
          "funcKey": "PULSE",
          "desc": "Pulse-generator lead Blue/Yellow.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pulse Generator Return",
          "funcKey": "GND",
          "desc": "Other pulse-generator lead Green/White.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        }
      ]
    },
    "HONDA_ATC250SX_8587_AC": {
      "source_key": "HONDA_ATC250SX_8587_AC",
      "name": "3-WHEELER: Honda ATC250SX 1985-87 (AC-CDI)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "3-Wheelers / ATCs",
      "source": "Honda 85-87 ATC250SX Service Manual (official Honda Motor Co., Ltd., © 1986), Chapter 14 IGNITION SYSTEM, read 2026-09-07 from the published scan at http://www.oscarmayer.net/atc/manuals/honda/atc250sx_85-87_servicemanual.pdf — page 14-1: AC-CDI with exciter (ND 50–200 Ω / Mitsuba 250–400 Ω) and pulse generator 290–360 Ω. Page 14-2 tests at the disconnected CDI coupler: kill/ignition-switch path Black/White to Green (continuity except ignition ON + stop RUN); coil circuit Black/Yellow to Green 0.1–0.3 Ω; pulse Blue/Yellow to Green/White 290–360 Ω; exciter Black/Red to ground. Page 14-3: harness between CDI and coil is Black/Yellow and Green.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Exciter Coil",
          "funcKey": "POWER",
          "desc": "Exciter is tested Black/Red to ground at the CDI coupler.",
          "volt": "AC (exciter)",
          "colors": [
            "Black/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Ignition/engine-stop path is Black/White to Green. Continuity except when ignition is ON and engine-stop is RUN.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Honda prints Green as the common return on the kill and coil coupler tests.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "CDI-to-coil primary is Black/Yellow (0.1–0.3 Ω to Green).",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pulse Generator Signal",
          "funcKey": "PULSE",
          "desc": "Pulse generator is tested Blue/Yellow to Green/White (290–360 Ω).",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pulse Generator Return",
          "funcKey": "GND",
          "desc": "Other pulse-generator lead Green/White.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        }
      ]
    },
    "HONDA_ATC250R_8586_AC": {
      "source_key": "HONDA_ATC250R_8586_AC",
      "name": "3-WHEELER: Honda ATC250R 1985-86 (AC-CDI)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "3-Wheelers / ATCs",
      "source": "Honda ATC250R '85-'86 Shop Manual (official Honda Motor Co., Ltd., © 1985), Chapter 15 ELECTRICAL SYSTEM, read 2026-09-07 from the published scan at http://www.oscarmayer.net/atc/manuals/honda/atc250r_85-86_servicemanual.pdf — page 15-1: AC-CDI with exciter 50–250 Ω and pulse generator 50–200 Ω. Page 15-2 ignition schematic: exciter Black/Red; pulse Blue/Yellow and Green/White; coil Black/Yellow; engine-stop Black/White shorted to Green when OFF; common ground Green. After-'85 inset keeps the same six colors on a 4-pin + 2-pin housing. Page 15-4 '85 coupler labels: Black/Yellow, Black/White, Black/Red, Blue/Yellow, Green, Green/White. This is not the air-cooled 1981 ATC250R CI-14 record.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Exciter Coil",
          "funcKey": "POWER",
          "desc": "Honda labels this EXT. Exciter is Black/Red (50–250 Ω to ground).",
          "volt": "AC (exciter)",
          "colors": [
            "Black/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Honda labels this SW. Color is Black/White. OFF shorts Black/White to Green.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Honda labels this E / Green on the '85 coupler.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Honda labels this IGN. Color is Black/Yellow.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pulse Generator Signal",
          "funcKey": "PULSE",
          "desc": "Honda labels this PC / P-C. Color is Blue/Yellow.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pulse Generator Return",
          "funcKey": "GND",
          "desc": "Other pulse-generator lead Green/White (After '85 also labeled E2 on the coupler drawing).",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        }
      ]
    },
    "HONDA_ATC200X_8687_AC": {
      "source_key": "HONDA_ATC200X_8687_AC",
      "name": "3-WHEELER: Honda ATC200X 1986-87 (AC-CDI)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "3-Wheelers / ATCs",
      "source": "Honda 86-87 ATC 200X Service Manual (official Honda Motor Co., Ltd., © 1986, July 1986 issue), Chapter 16 ELECTRICAL SYSTEM, read 2026-09-07 from the published scan at http://www.oscarmayer.net/atc/manuals/honda/86-87_ATC200X_Service_Manual.pdf — page 16-3 ignition schematic: exciter Black/Red; pulse Blue/Yellow and Green/White; coil Black/Yellow; engine-stop Black/White shorted to Green when OFF; After '86 also adds an ignition switch on that same Black/White kill path. Page 16-4 coupler tests: coil Black/Yellow–Green 0.1–0.3 Ω; pulse Blue/Yellow–Green/White 290–360 Ω; exciter Black/Red to ground. This is not the 1983-85 ATC200X record (that earlier SM uses a Black kill wire and a Green pulse return).",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Exciter Coil",
          "funcKey": "POWER",
          "desc": "Exciter is Black/Red at the CDI coupler (page 16-4 / 16-5).",
          "volt": "AC (exciter)",
          "colors": [
            "Black/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Engine-stop (and After '86 ignition switch) is Black/White. OFF shorts Black/White to Green.",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Honda prints Green as the common CDI/coil/kill ground.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "CDI-to-coil primary is Black/Yellow.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pulse Generator Signal",
          "funcKey": "PULSE",
          "desc": "Pulse-generator lead Blue/Yellow.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pulse Generator Return",
          "funcKey": "GND",
          "desc": "Other pulse-generator lead Green/White. The 1983-85 ATC200X SM printed Green here instead — do not mix the two years.",
          "volt": "0V",
          "colors": [
            "Green/White"
          ]
        }
      ]
    },
    "HONDA_ATC250R_1981_AC": {
      "source_key": "HONDA_ATC250R_1981_AC",
      "name": "3-WHEELER: Honda ATC250R 1981 (AC-CDI, CI-14)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "3-Wheelers / ATCs",
      "source": "Honda ATC250R Shop Manual (official Honda Motor Co., Ltd., Date of Issue May 1981), Chapter 15 ELECTRICAL SYSTEM, read 2026-09-07 from the published 81-84 scan at http://www.oscarmayer.net/atc/manuals/honda/atc250r_81-84_servicemanual.pdf — page 15-3: exciter Black/Red to ground 245 Ω; lighting Yellow is not the CDI feed. Page 15-4 CDI unit marked CI-14 0.9, 6-cavity housing with one empty hole: Black/Yellow (IGN), Black/Red (EXT), Black (SW), Blue/Yellow (PC), Green (E). Page 15-5 pulse generator Blue/Yellow to Green 20–60 Ω. Page 15-7 engine-stop OFF = continuity Black to Green. 1982 and 1983-84 addenda in the same PDF were not used for pin colors. This is not the liquid-cooled 1985-86 ATC250R record.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "AC IN",
          "active": true,
          "role": "HV Source from Exciter Coil",
          "funcKey": "POWER",
          "desc": "Honda labels this EXT. Exciter is Black/Red (245 Ω to ground).",
          "volt": "AC (exciter)",
          "colors": [
            "Black/Red"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Honda labels this SW. Color is Black. OFF shorts Black to Green.",
          "volt": "N/A",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Honda labels this E. Color is Green.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Honda labels this IGN. Color is Black/Yellow.",
          "volt": "400V peak",
          "colors": [
            "Black/Yellow"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pulse Generator Signal",
          "funcKey": "PULSE",
          "desc": "Honda labels this PC. Color is Blue/Yellow.",
          "volt": "Low AC",
          "colors": [
            "Blue/Yellow"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pulse Generator Return",
          "funcKey": "GND",
          "desc": "Pulse coil is measured Blue/Yellow to Green. The 1981 coupler drawing has no separate Green/White pulse pin — the return shares the Green ground color.",
          "volt": "0V",
          "colors": [
            "Green"
          ]
        }
      ]
    },
    "YAMAHA_YTM200K_AC": {
      "source_key": "YAMAHA_YTM200K_AC",
      "name": "3-WHEELER: Yamaha YTM200K (AC-CDI magneto)",
      "system": "AC",
      "colorClass": "active-ac",
      "gridClass": "connector-grid",
      "category": "3-Wheelers / ATCs",
      "source": "Yamaha YTM200K Service Manual (LIT-11616-03-83), Chapter 6 ELECTRICAL and Chapter 7 wiring diagram, read 2026-09-07 from the published scan at http://www.oscarmayer.net/atc/manuals/yamaha/ytm200_yamaha_servicemanual.pdf — page 6-1 ignition schematic and page 7-30 YTM200K wiring diagram: pickup White/Red and White/Green; coil Orange; engine-stop OFF connects Black/White to Black; common magneto/chassis return Black; lighting Yellow/Red is not ignition. Page 6-2: pickup White/Red–White/Green 196 Ω ±10%. POWER/exciter is left unused because the same manual prints two different charge-coil colors: page 6-2 table and 4-pin coupler drawing say Brown–Black (386 Ω ±10%), while pages 6-1 and 7-30 label that magneto-to-CDI lead Black/Red. Do not guess which printed color is on the CDI pin.",
      "provenance": "verified",
      "pins": 6,
      "slots": [
        {
          "pin": 1,
          "label": "X",
          "active": false,
          "role": "Not Connected",
          "funcKey": "UNUSED",
          "desc": "Charge/exciter color conflicts inside the same Yamaha SM (Brown–Black on page 6-2 vs Black/Red on pages 6-1 and 7-30) — not modeled.",
          "volt": "--",
          "colors": [
            "N/C"
          ]
        },
        {
          "pin": 2,
          "label": "KILL",
          "active": true,
          "role": "Ignition Interrupt",
          "funcKey": "KILL",
          "desc": "Engine-stop OFF connects Black/White to Black (ground-to-kill).",
          "volt": "N/A",
          "colors": [
            "Black/White"
          ]
        },
        {
          "pin": 3,
          "label": "GND",
          "active": true,
          "role": "System Ground",
          "funcKey": "GND",
          "desc": "Black is the common magneto/chassis return on the ignition schematic and wiring diagram.",
          "volt": "0V",
          "colors": [
            "Black"
          ]
        },
        {
          "pin": 4,
          "label": "COIL",
          "active": true,
          "role": "Output to Ignition Coil",
          "funcKey": "COIL",
          "desc": "Wiring diagram routes Orange from the CDI to the ignition coil primary.",
          "volt": "400V peak",
          "colors": [
            "Orange"
          ]
        },
        {
          "pin": 5,
          "label": "PULSE+",
          "active": true,
          "role": "Pickup Coil Signal",
          "funcKey": "PULSE",
          "desc": "Pickup pair White/Red–White/Green (196 Ω ±10%). White/Red is the pulse lead.",
          "volt": "Low AC",
          "colors": [
            "White/Red"
          ]
        },
        {
          "pin": 6,
          "label": "PULSE-",
          "active": true,
          "role": "Pickup Coil Return",
          "funcKey": "GND",
          "desc": "Other pickup-coil lead White/Green.",
          "volt": "0V",
          "colors": [
            "White/Green"
          ]
        }
      ]
    }
  }
};
})(typeof window !== "undefined" ? window : globalThis);
