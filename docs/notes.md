# HIG Scraper & Project Notes

## Scraper Progress & Datasets
- [x] **Buttons** (`scraper/output/buttons.json`) - 15 sections extracted & committed (`346c6cd`).
- [x] **Navigation and search** (`scraper/output/navigation-and-search.json`) - Extracted & committed (`511de7b`).
- [x] **Gestures** (`scraper/output/gestures.json`) - 13 sections extracted & committed (`751684c`).
- [x] **Onboarding** (`scraper/output/onboarding.json`) - 6 sections extracted & committed (`b459194`).
- [x] **App icons** (`scraper/output/app-icons.json`) - 12 sections extracted & committed (`4021e21`).

## Bright Data KYC & Infrastructure Status
- **KYC Status**: Pending verification on Bright Data platform.
- **Impact**: Cloud proxy pool access is blocked until KYC is cleared; local runner (`scraper/collector.js`) operates directly via HTTPS without proxy auth issues.
- **Action Plan for Tomorrow**:
  1. Check Bright Data dashboard for KYC clearance.
  2. Once KYC is cleared, publish `scraper/interaction.js` and `scraper/parser.js` into Scraper Studio IDE for automated recurring runs.
  3. If still pending, continue using local collector pipeline for dataset generation.

## Unresolved Items & Future Scope
- **Scraper Studio Webhooks**: Set up webhook ingestion into `backend/` once KYC clears.
- **Additional HIG Categories**: Prepare collector batch for remaining UI components (Toggles, Sidebars, Toolbars, Sheets) for the RAG ingestion pipeline.
