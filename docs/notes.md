# HIG Scraper & Project Notes

## Scraper Progress & Datasets
- [x] **Buttons** (`scraper/output/buttons.json`) - 15 sections extracted & committed (`346c6cd`).
- [x] **Navigation and search** (`scraper/output/navigation-and-search.json`) - Extracted & committed (`511de7b`).
- [x] **Gestures** (`scraper/output/gestures.json`) - 13 sections extracted & committed (`751684c`).
- [x] **Onboarding** (`scraper/output/onboarding.json`) - 6 sections extracted & committed (`b459194`).
- [x] **App icons** (`scraper/output/app-icons.json`) - 12 sections extracted & committed (`4021e21`).

## Infrastructure & Scraper Studio Integration
- **Scraper Studio Scripts**: `scraper/interaction.js` and `scraper/parser.js` are ready for deployment into Bright Data Web Scraper IDE / Scraper Studio.
- **Local Runner**: `scraper/collector.js` provides CLI execution for local dataset generation and testing.

## Future Scope & Next Steps
- **Scraper Studio Webhooks**: Set up webhook ingestion into `backend/` for live automated data pipelines.
- **Additional HIG Categories**: Expand collector coverage to remaining UI components (Toggles, Sidebars, Toolbars, Sheets) for the RAG ingestion pipeline.
