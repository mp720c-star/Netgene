# Ravin Lookup

Offline vehicle diagnostic lookup tool for **Car/Truck**, **Dirt Bike/Moto**, and **ATV/4-Wheeler**.

## Quick start (browser)

Open `Index.html` in a browser, or serve the folder:

```bash
npx --yes serve .
```

## Desktop (Electron)

```bash
npm install
npm start
```

Category-locked modes (used by the three Windows installers):

```bash
npm run start:car
npm run start:moto
npm run start:atv
```

## Windows installers (all three)

Builds a portable Windows `.exe` for each vehicle category:

```bash
npm install
npm run pack:win:all
```

Outputs land in `dist/`:

| Installer product | Lock |
| --- | --- |
| Ravin Lookup Car Truck | Car/Truck |
| Ravin Lookup Dirt Bike | Dirt Bike/Moto |
| Ravin Lookup ATV | ATV/4-Wheeler |

Individual builds:

```bash
npm run pack:win:car
npm run pack:win:moto
npm run pack:win:atv
```

On a Windows host (or Linux with Wine), also build NSIS + MSI for each category:

```bash
npm run pack:win:full
```

## Tests

```bash
npm test
```

Optional headed UI demo (requires Playwright):

```bash
npx --yes playwright@1.49.0 install chrome
npm install -D playwright@1.49.0
# serve Index.html, then:
node tests/ui-demo.mjs
```

## Source layout

- `Index.html` — UI shell
- `vehicles-data.js` — full vehicle database (all three categories)
- `app-logic.js` — lookup UI wiring + diagnostic rules
- `electron/` — desktop shell + per-installer lock file
- `Car:truck.json*` — legacy upload chunks (kept for reference; app uses `vehicles-data.js`)
