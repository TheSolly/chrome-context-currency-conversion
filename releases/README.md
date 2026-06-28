# Releases — Chrome Web Store packages

Built extension packages (`.zip`) for uploading to the Chrome Web Store live here.

The `.zip` files themselves are build artifacts and are **gitignored** (see `*.zip` in
`.gitignore`); only this README is tracked so the folder persists.

## How to build a package

```bash
npm run build                 # outputs the extension to dist/
( cd dist && zip -rq "../releases/currency-converter-v<VERSION>.zip" . -x "*.DS_Store" -x ".vite/*" )
```

Use the version from `manifest.json` for `<VERSION>`. Then upload the zip at the
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
→ your item → **Package → Upload new package**.
