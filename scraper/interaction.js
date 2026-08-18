/**
 * Bright Data Scraper Studio - Interaction Code
 * Browser-based rendering interaction code for Apple Human Interface Guidelines (HIG).
 */

const targetUrl = input && input.url ? input.url : 'https://developer.apple.com/design/human-interface-guidelines/navigation-and-search';

// Navigate to target URL
navigate(targetUrl);

// Wait for JS hydration and main content container rendering
wait('main, article, div[role="main"], body', { timeout: 20000 });

// Additional wait to ensure full JS rendering of components and guidance rules
sleep(2000);

// Run the parser code to extract structured data (headings, description text, Do/Don't guidance)
let extractedData = parse();

// Collect the extracted dataset into Bright Data Scraper Studio output
collect(extractedData);
