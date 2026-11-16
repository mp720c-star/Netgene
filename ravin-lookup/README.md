# Ravin Lookup

Offline vehicle diagnostic lookup with category-locked Windows portable installers.

## Web downloads

Built installers are published under `/downloads/` on the Netgene hub / Mike AI test deploy:

| Product | File |
| --- | --- |
| Car / Truck | `Ravin-Lookup-Car-Truck-1.0.0-win-x64.exe` |
| Dirt Bike / Moto | `Ravin-Lookup-Dirt-Bike-1.0.0-win-x64.exe` |
| ATV / 4-Wheeler | `Ravin-Lookup-ATV-1.0.0-win-x64.exe` |

Open that page on another computer and click download, or download here and copy the `.exe`.

## Rebuild locally

```bash
cd ravin-lookup
npm install
npm test
npm run pack:win:all
```

Copy artifacts into the download folders:

```bash
cp "dist/Ravin Lookup Car Truck-1.0.0-win-x64.exe" ../downloads/Ravin-Lookup-Car-Truck-1.0.0-win-x64.exe
cp "dist/Ravin Lookup Dirt Bike-1.0.0-win-x64.exe" ../downloads/Ravin-Lookup-Dirt-Bike-1.0.0-win-x64.exe
cp "dist/Ravin Lookup ATV-1.0.0-win-x64.exe" ../downloads/Ravin-Lookup-ATV-1.0.0-win-x64.exe
cp ../downloads/*.exe ../mike-ai/public/downloads/
(cd ../downloads && sha256sum *.exe > SHA256SUMS.txt)
cp ../downloads/SHA256SUMS.txt ../mike-ai/public/downloads/
```
