# HIG Scraper & Project Notes

## Scraper Progress & Datasets
- [x] **Buttons** (`scraper/output/buttons.json`) - 17 sections, 44 guidance rules.
- [x] **Navigation and search** (`scraper/output/navigation-and-search.json`) - Re-extracted via browser-based Puppeteer collector across all 5 subsections (43 sections, 62 guidance rules).
- [x] **Gestures** (`scraper/output/gestures.json`) - 14 sections, 20 guidance rules.
- [x] **Onboarding** (`scraper/output/onboarding.json`) - 7 sections, 12 guidance rules.
- [x] **App icons** (`scraper/output/app-icons.json`) - 14 sections, 21 guidance rules.
- [x] **Alerts** (`scraper/output/alerts.json`) - 12 sections, 19 guidance rules.
- [x] **Modality** (`scraper/output/modality.json`) - 6 sections, 9 guidance rules.
- [x] **Sheets** (`scraper/output/sheets.json`) - 11 sections, 17 guidance rules.
- [x] **Popovers** (`scraper/output/popovers.json`) - 6 sections, 16 guidance rules.
- [x] **Icons** (`scraper/output/icons.json`) - 16 sections, 18 guidance rules.

## Infrastructure & Scraper Studio Integration
- **Scraper Studio Scripts**: `scraper/interaction.js` and `scraper/parser.js` are ready for deployment into Bright Data Web Scraper IDE / Scraper Studio.
- **Local Runner**: `scraper/collector.js` provides CLI execution for local dataset generation and testing.

## Future Scope & Next Steps
- **Scraper Studio Webhooks**: Set up webhook ingestion into `backend/` for live automated data pipelines.
- **Additional HIG Categories**: Expand collector coverage to remaining UI components (Toggles, Sidebars, Toolbars, Sheets) for the RAG ingestion pipeline.
