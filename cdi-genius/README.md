# CDI Genius - Prototype

React Native + Expo prototype implementing a Diagnostic Decision Tree (DDT) for CDI units.

## Quick start

From this folder (`cdi-genius/`):

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Expo:
   ```bash
   npx expo start
   ```

3. Open with Expo Go on a device, an emulator, or press `w` for web.

## Flow
1. Select model
2. Perform continuity test (PASS/FAIL)
3. Enter resistance measurements for each configured test
4. Observe spark and record
5. See final diagnosis

## Notes
- Data is local JSON in `src/data/sample-models.json`.
- The DDT is deterministic and implemented in `src/ddt/ddtEngine.js`.
- Resistance bounds are dynamically computed from nominal and tolerance.

## Next steps (suggested)
- Add more models and a small admin UI for editing JSON.
- Replace local JSON with a backend (NoSQL) and sync.
- Improve SVG connector graphics and orientation handling per model.
- Add device-level calibration and unit tests.
