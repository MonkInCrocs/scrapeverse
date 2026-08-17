/**
 * Bright Data Scraper Studio - Interaction Code
 * Target URL: https://developer.apple.com/design/human-interface-guidelines/buttons
 */

// Navigate to target URL provided in input, or fallback to default Apple HIG Buttons URL
const targetUrl = input && input.url ? input.url : 'https://developer.apple.com/design/human-interface-guidelines/buttons';
navigate(targetUrl);

// Wait for the page content or main container to render
wait('main, body', { timeout: 15000 });

// Run the parser code to extract structured data (headings, description text, Do/Don't guidance)
let extractedData = parse();

// Collect the extracted dataset into Bright Data Scraper Studio output
collect(extractedData);
