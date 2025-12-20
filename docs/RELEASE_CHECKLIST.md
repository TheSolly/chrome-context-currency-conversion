# Chrome Web Store Release Checklist

**Extension:** Currency Converter
**Version:** 1.0.0
**Target Release Date:** December 2025
**Last Updated:** 2025-12-20

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Developer Account | Completed | 2/2 |
| 2. Manifest Review | Completed | 5/5 |
| 3. Store Assets | Completed | 4/4 |
| 4. Privacy & Data | Completed | 4/4 |
| 5. Store Listing | Completed | 4/4 |
| 6. Pre-Submission Testing | Completed | 5/5 |
| 7. Final Review | Completed | 5/5 |

---

## 1. Developer Account Setup

| Task | Status | Notes |
|------|--------|-------|
| Pay $5 registration fee | :white_check_mark: Done | Paid on 2025-12-20 |
| Trader/Non-Trader declaration | :white_check_mark: Done | Selected Non-Trader (individual developer) |
| Use appropriate email | :white_check_mark: Done | - |

---

## 2. Manifest Review

| Item | Current State | Status | Action Needed |
|------|---------------|--------|---------------|
| `manifest_version: 3` | MV3 | :white_check_mark: Good | None |
| Icons (16, 32, 48, 128px) | All present | :white_check_mark: Good | None |
| Version | `1.0.0` | :white_check_mark: Good | First release |
| `host_permissions` | Specific API domains only | :white_check_mark: Good | Narrowed to 7 API domains |
| `<all_urls>` in content_scripts | Required for currency detection | :white_check_mark: Good | Justified - detects currencies on any page |

### Permission Justifications (Prepare These)

| Permission | Justification |
|------------|---------------|
| `contextMenus` | Required to show "Convert Currency" option when user right-clicks selected text |
| `storage` | Required to save user preferences (base currency, favorites) and conversion history locally |
| `activeTab` | Required to read the selected text on the current page for currency detection |
| `notifications` | Required for rate alert notifications when target exchange rates are reached |
| `alarms` | Required for periodic exchange rate checking for rate alerts feature |
| `host_permissions` | Limited to specific currency API domains (exchangerate-api.com, fixer.io, currencyapi.com, alphavantage.co, currencylayer.com, openexchangerates.org) for fetching real-time exchange rates |

---

## 3. Required Store Assets

| Asset | Size | Status | File Location |
|-------|------|--------|---------------|
| Store Icon | 128x128 px | :white_check_mark: Have | `assets/icons/icon-128.png` |
| Screenshot 1 | 1280x800 px | :white_check_mark: Have | `assets/store/screenshot-1-conversion.png` |
| Screenshot 2 | 1280x800 px | :white_check_mark: Have | `assets/store/screenshot-2-settings.png` |
| Screenshot 3 | 1280x800 px | :white_check_mark: Have | `assets/store/screenshot-3-history.png` |
| Screenshot 4 | 1280x800 px | :white_check_mark: Have | `assets/store/screenshot-4-favorites.png` |
| Small Promo Tile | 440x280 px | :white_check_mark: Have | `assets/store/promo-tile-440x280.png` |
| Marquee Image | 1400x560 px | :grey_question: Optional | - |

### Screenshots Created
1. Conversion tooltip showing inline currency conversion
2. Settings tab with primary currencies and quick convert
3. Conversion history with stats and filters
4. Favorites tab for saved currency pairs

---

## 4. Privacy & Data Disclosure

| Requirement | Status | Notes |
|-------------|--------|-------|
| Privacy Policy URL | :white_check_mark: Done | https://sites.google.com/view/currency-converter-ext/home |
| Data Collection Disclosure | :white_check_mark: Done | No personal data collected - only local storage |
| Limited Use Disclosure | :white_check_mark: Done | Included in privacy policy |
| Permission Justifications | :white_check_mark: Done | See section 2 above |

### Data Collected by Extension
- **User Preferences:** Base currency, secondary currency, theme settings (stored locally)
- **Conversion History:** Past conversions for user reference (stored locally)
- **Favorites:** Saved currency pairs (stored locally)
- **No data transmitted to external servers except:**
  - Exchange rate API calls (no personal data sent)

### Privacy Policy Requirements
- [x] Create privacy policy page
- [x] Host at accessible URL (Google Sites)
- [x] Add URL to developer dashboard
- [x] Include Limited Use disclosure statement

---

## 5. Store Listing Content

| Field | Max Length | Status | Content |
|-------|------------|--------|---------|
| Short Description | 132 chars | :white_check_mark: Done | 131 characters |
| Detailed Description | 16,000 chars | :white_check_mark: Done | Full description ready |
| Category | - | :white_check_mark: Done | Productivity |
| Primary Language | - | :white_check_mark: Done | English |

### Short Description (131 chars)
```
Convert currencies instantly! Right-click any amount on web pages to see real-time conversions. Track history & set rate alerts.
```

### Detailed Description
See full description in: `docs/STORE_LISTING.md`

**Highlights:**
- Instant context menu conversion
- Smart currency detection (150+ currencies)
- Real-time exchange rates
- Conversion history with export
- Favorite currency pairs
- Rate alerts with notifications
- Privacy-first (all data stored locally)

---

## 6. Pre-Submission Testing

| Test | Command/Action | Status | Result |
|------|----------------|--------|--------|
| Build production bundle | `npm run build` | :white_check_mark: Passing | Built in 386ms |
| Lint check | `npm run lint` | :white_check_mark: Passing | 0 errors, 13 warnings (test files) |
| Load unpacked in Chrome | Developer Mode | :white_check_mark: Passing | Extension loads correctly |
| Test all core features | Manual testing | :white_check_mark: Passing | All features working |
| Test on fresh profile | No cached data | :white_check_mark: Passing | Works on fresh install |

### Core Features Tested
- [x] Currency detection on text selection
- [x] Context menu conversion
- [x] Popup opens correctly
- [x] Settings save and persist
- [x] Conversion history records
- [x] Favorites add/remove
- [x] Quick Convert feature
- [x] All tabs accessible

---

## 7. Final Review Before Submission

| Check | Status | Notes |
|-------|--------|-------|
| No console.log statements | :white_check_mark: Done | 0 found in production build |
| No excessive permissions | :white_check_mark: Done | Narrowed to 7 specific API domains |
| Privacy policy linked | :white_check_mark: Done | https://sites.google.com/view/currency-converter-ext/home |
| All assets ready | :white_check_mark: Done | 4 screenshots + promo tile |
| Description accurate | :white_check_mark: Done | 131 char short + full description |

---

## Submission Checklist

- [x] All required assets ready (`assets/store/`)
- [x] Privacy policy URL provided
- [x] Data collection disclosures completed
- [x] Store listing content ready (`docs/STORE_LISTING.md`)
- [x] Extension ZIP file created: `currency-converter-v1.0.0.zip` (107 KB)
- [x] Final testing completed

---

## Post-Submission

- [ ] Monitor review status (typically 1-3 business days)
- [ ] Respond promptly to any reviewer questions
- [ ] If rejected, review feedback and resubmit
- [ ] Once approved, verify listing appears correctly
- [ ] Consider gradual rollout (10-25% initially)

---

## Resources

- [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish)
- [Register Your Developer Account](https://developer.chrome.com/docs/webstore/register)
- [Supplying Images](https://developer.chrome.com/docs/webstore/images)
- [Privacy Policies](https://developer.chrome.com/docs/webstore/program-policies/privacy)
- [Disclosure Requirements](https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements)
- [Best Practices and Guidelines](https://developer.chrome.com/docs/webstore/program-policies/best-practices)
- [Troubleshooting Violations](https://developer.chrome.com/docs/webstore/troubleshooting)
- [Publishing MV3 Extensions](https://developer.chrome.com/docs/extensions/migrating/publish-mv3/)

---

## Notes & Updates

### 2025-12-20
- Created release checklist
- Developer account registered and paid
- Selected Non-Trader status (individual developer in Egypt)
- Codebase cleanup completed (removed console logs)
- Build and lint passing
- **Manifest Review completed:**
  - Narrowed `host_permissions` from broad `https://*/*` to specific API domains only
  - Prepared justifications for `<all_urls>` in content_scripts (required for currency detection on any page)
- **Store Assets completed:**
  - Created 4 screenshots (1280x800) with gradient backgrounds
  - Created promo tile (440x280) with extension branding
  - All assets saved to `assets/store/`
- **Privacy & Data completed:**
  - Privacy policy hosted on Google Sites: https://sites.google.com/view/currency-converter-ext/home
  - All data stored locally, no personal data collection
  - Limited Use disclosure included
- **Store Listing completed:**
  - Short description (131 chars) ready
  - Detailed description with full feature list saved to `docs/STORE_LISTING.md`
  - Category: Productivity, Language: English
- **Pre-Submission Testing completed:**
  - Build passing (386ms)
  - Lint passing (0 errors)
  - All core features tested and working
  - Extension loads correctly in Chrome
- **Final Review completed:**
  - No console.log in production build
  - Permissions narrowed to specific API domains
  - ZIP file created: `currency-converter-v1.0.0.zip` (107 KB)
  - **READY FOR SUBMISSION!**
