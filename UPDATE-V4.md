# Pockit v4: light layout, short copy, small red accents

Install (does not delete anything). Extract the zip to a temporary folder, then in PowerShell, from your Pockit project folder:

  Copy-Item -Recurse -Force "$HOME\Downloads\pockit-v4\pockit-v4\*" .

Then restart: Ctrl+C, npm run dev.

Needs v2 installed first. This replaces v3 if you installed it (the navy title bars are gone). If you have components/PageBand.tsx from v3, you can delete it, nothing uses it.
