# Bright Data Scraper Studio Collector - Apple HIG Buttons

This folder contains the Bright Data Scraper Studio collector scripts for scraping the **Apple Human Interface Guidelines (HIG) Buttons** documentation page:
`https://developer.apple.com/design/human-interface-guidelines/buttons`

## Collector Structure

1. **`interaction.js`**:
   - Bright Data Scraper Studio **Interaction Code** (Browser Automation Context).
   - Manages page navigation, waits for elements to render, executes `parse()`, and calls `collect(data)`.

2. **`parser.js`**:
   - Bright Data Scraper Studio **Parser Code** (Cheerio HTML/DOM Context).
   - Extracts section headings (`h2`, `h3`, `h4`), description text, and categorizes Do/Don't guidance.

3. **`collector.js`**:
   - Standalone local Node.js runner that fetches and parses the Apple HIG page content and saves the extracted JSON dataset to `output/buttons.json`.

4. **`output/buttons.json`**:
   - Structured JSON output containing section headings, description texts, and classified Do/Don't guidance rules.

## Local Execution

To run the collector locally and regenerate `output/buttons.json`:

```bash
node scraper/collector.js
```

## Bright Data Scraper Studio Deployment

1. Log into your **Bright Data Dashboard** and open **Web Scraper IDE / Scraper Studio**.
2. Create a new collector stage or paste the interaction code from `scraper/interaction.js` into the **Interaction Code** tab.
3. Paste the parser code from `scraper/parser.js` into the **Parser Code** tab.
4. Test run the collector with input:
   ```json
   { "url": "https://developer.apple.com/design/human-interface-guidelines/buttons" }
   ```
5. Deliver dataset as JSON.
