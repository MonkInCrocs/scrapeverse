# Apple HIG Checker & Scrapeverse Collector

Scraper collectors and datasets for Apple Human Interface Guidelines (HIG) built for Bright Data Scraper Studio.

## Scraped Datasets (`scraper/output/`)

5 pages scraped into structured JSON:
1. `scraper/output/buttons.json` (Buttons guidelines, 15 sections)
2. `scraper/output/navigation-and-search.json` (Navigation and search components)
3. `scraper/output/gestures.json` (Gestures guidelines, 13 sections)
4. `scraper/output/onboarding.json` (Onboarding guidelines, 6 sections)
5. `scraper/output/app-icons.json` (App icons guidelines, 12 sections)

## Bright Data KYC & Compliance Disclosure Stub

- **KYC Status**: Pending verification on Bright Data account (plan cloud deployment and proxy pool testing tomorrow accordingly).
- **Execution Mode**: Local Node collector (`scraper/collector.js`) uses direct HTTPS endpoint parsing to ensure fast, reliable local dataset generation without proxy auth blocking.
- **Compliance Note**: All extracted content originates from publicly accessible Apple Developer documentation (`https://developer.apple.com/design/human-interface-guidelines/`) for educational, design analysis, and compliance checking purposes.
