# Currency Converter - Future Roadmap

**Last Updated:** June 22, 2026
**Current Version:** 1.1.0

---

## Overview

This document tracks planned features, improvements, and enhancements for future versions of the Currency Converter extension.

---

## Planned Features

### v1.1.0 - Performance & Caching ✅ (Released)

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Exchange Rate Caching | High | ✅ Done | Cache exchange rates locally to reduce API calls |
| Smart Cache Invalidation | High | ✅ Done | Auto-refresh cache based on configurable intervals |
| Offline Mode | Medium | ✅ Done | Use cached rates when offline |
| API Request Optimization | Medium | ✅ Done | Batch requests and deduplicate calls |

**Implementation Notes:**
- ✅ Durable cache via Chrome Storage API (`utils/rate-cache.js`), keyed by base currency
- ✅ Full per-base rate table cached, so one API call serves every target (batch optimization)
- ✅ Configurable cache duration (default 1 hour) via Settings → Performance & Caching
- ✅ Concurrent identical requests are deduplicated (in-flight coalescing)
- ✅ Background refresh before expiry via `chrome.alarms` (`rate_cache_refresh`)
- ✅ "🟢 Live / ⚡ Cached / 📴 Offline" freshness indicator shown in the conversion tooltip and popup test
- ✅ Offline mode + auto-refresh toggles and a "Clear rate cache" action in Settings

---

### v1.2.0 - Premium Features & Payments

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Payment Integration | High | Planned | Add payment options for premium tiers |
| PayPal Integration | High | Planned | One-time and subscription payments via PayPal |
| Stripe Integration | Medium | Planned | Card payments via Stripe |
| Premium Tier Benefits | High | Planned | Unlock additional features for paying users |
| License Key System | Medium | Planned | Alternative to online payments |

**Premium Tier Features:**
- Unlimited rate alerts (free: 3 max)
- Unlimited quick convert currencies (free: 3 max)
- Priority exchange rate updates
- Advanced conversion history analytics
- Export to multiple formats (CSV, JSON, PDF)
- No usage limits

**Implementation Notes:**
- Use PayPal REST API for payments
- Store subscription status securely
- Implement grace period for expired subscriptions
- Add restore purchases functionality

---

### v1.3.0 - Support & Help

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| In-App Help Center | High | Planned | Built-in help documentation |
| FAQ Section | High | Planned | Common questions and answers |
| Support Contact Form | Medium | Planned | Direct support request submission |
| Onboarding Tutorial | Medium | Planned | First-time user walkthrough |
| Keyboard Shortcuts Help | Low | Planned | Show available shortcuts |

**Support Links to Add:**
- Help Center / Documentation
- FAQ page
- Contact Support email
- Feature Request form
- Bug Report form
- Chrome Web Store review link

**Implementation Notes:**
- Create Google Sites pages for help content
- Add help icon in popup header
- Implement tooltip hints for new users
- Add "What's New" section for updates

---

## Technical Improvements

### Code Quality
- [ ] Add comprehensive unit tests
- [ ] Implement E2E testing with Puppeteer
- [ ] Add TypeScript for better type safety
- [ ] Improve error handling and logging

### Performance
- [ ] Lazy load popup tabs
- [ ] Optimize content script size
- [ ] Reduce memory footprint
- [ ] Implement service worker caching

### Security
- [ ] Add CSP improvements
- [ ] Implement rate limiting
- [ ] Add input sanitization improvements
- [ ] Security audit and penetration testing

---

### v1.4.0 - Multi-Provider & Reliability

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| API Fallback System | High | Planned | Auto-switch to backup API if primary fails |
| Provider Health Check | Medium | Planned | Monitor API availability |
| Rate Comparison | Low | Planned | Compare rates across providers |
| Custom API Support | Low | Planned | Allow users to add their own API keys |

---

### v1.5.0 - Advanced Features

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Cryptocurrency Support | Medium | Planned | Add BTC, ETH, and major cryptos |
| Historical Rate Charts | Medium | Planned | View rate trends over time |
| Batch Conversion | Low | Planned | Convert multiple amounts at once |
| Currency Calculator | Low | Planned | Math expressions with currencies |
| Auto-Convert on Page | Low | Planned | Automatically show conversions on hover |

---

### v1.6.0 - User Experience

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Dark Mode | High | Planned | Theme support (light/dark/system) |
| Localization (i18n) | Medium | Planned | Support multiple languages |
| Browser Sync | Medium | Planned | Sync settings across devices |
| Keyboard Shortcuts | Medium | Planned | Quick access via hotkeys |
| Widget Mode | Low | Planned | Floating mini-converter |
| Accessibility (a11y) | High | Planned | Screen reader improvements |

---

## User Requested Features

Track feature requests from users here:

| Request | Votes | Status | Notes |
|---------|-------|--------|-------|
| Dark mode | - | Planned v1.6 | Theme support |
| Widget/sidebar mode | - | Planned v1.6 | Floating converter |
| Historical rates | - | Planned v1.5 | View past exchange rates |
| Currency calculator | - | Planned v1.5 | Math expressions with currencies |
| Browser sync | - | Planned v1.6 | Sync settings across devices |
| Cryptocurrency | - | Planned v1.5 | BTC, ETH support |
| Auto-convert on page | - | Considering | Show conversions automatically |
| Multiple languages | - | Planned v1.6 | i18n support |

---

## Version History

### v1.1.0 (June 2026)
- Performance & Caching release
- Durable, service-worker-safe exchange-rate cache (one full per-base rate table per API call)
- Configurable cache duration (default 1 hour) with smart background refresh before expiry
- Offline mode using cached rates, with a Live/Cached/Offline freshness indicator
- Request deduplication to coalesce concurrent identical conversions
- Consolidated three legacy cache layers into a single source of truth
- Added Vitest unit tests for the caching layer

### v1.0.0 (December 2025)
- Initial release
- Context menu currency conversion
- Smart currency detection
- Conversion history
- Favorite currency pairs
- Rate alerts (basic)
- Quick convert feature

---

## Contributing

Feature suggestions and bug reports are welcome! Please submit through:
- Chrome Web Store reviews
- GitHub Issues (if open source)
- Contact form on website

---

## Notes

- Priorities may change based on user feedback
- Timeline estimates are not provided (focus on quality)
- Security and privacy remain top priorities
