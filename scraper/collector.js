const fs = require('fs');
const path = require('path');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}

const targetSlug = process.argv[2] || 'all';
const OUTPUT_DIR = path.join(__dirname, 'output');

const NAVIGATION_SEARCH_SUBSECTIONS = [
  { slug: 'path-controls', title: 'Path controls' },
  { slug: 'search-fields', title: 'Search fields' },
  { slug: 'sidebars', title: 'Sidebars' },
  { slug: 'tab-bars', title: 'Tab bars' },
  { slug: 'token-fields', title: 'Token fields' }
];

const HIG_PAGES = [
  'buttons',
  'gestures',
  'onboarding',
  'app-icons',
  'navigation-and-search'
];

function classifyGuidance(ruleText, fullText) {
  const lowerRule = ruleText.toLowerCase();
  if (lowerRule.startsWith("don’t") || lowerRule.startsWith("don't") || lowerRule.includes("don't") || lowerRule.includes("don’t") || lowerRule.startsWith("avoid")) {
    return "Don't";
  } else if (lowerRule.startsWith("do") || lowerRule.startsWith("prefer") || lowerRule.startsWith("use") || lowerRule.startsWith("make") || lowerRule.startsWith("provide") || lowerRule.startsWith("ensure") || lowerRule.startsWith("always")) {
    return "Do";
  }
  return "Guidance";
}

async function collectPage(browser, slug) {
  const targetUrl = `https://developer.apple.com/design/human-interface-guidelines/${slug}`;
  const outputFile = path.join(OUTPUT_DIR, `${slug}.json`);

  if (slug === 'navigation-and-search') {
    console.log(`[Browser Collector] Collecting 'navigation-and-search' across 5 subsections...`);
    const page = await browser.newPage();
    const allSections = [];

    for (const sub of NAVIGATION_SEARCH_SUBSECTIONS) {
      const subUrl = `https://developer.apple.com/design/human-interface-guidelines/${sub.slug}`;
      console.log(`  -> Rendering subsection: '${sub.title}' (${subUrl})...`);

      await page.goto(subUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));

      const extractedSecs = await page.evaluate((subTitle) => {
        const main = document.querySelector('main, article, div[role="main"]') || document.body;
        const secList = [];

        let currentSec = {
          subsection: subTitle,
          section_heading: 'Overview',
          description_text: '',
          guidance: []
        };

        const elements = Array.from(main.querySelectorAll('h2, h3, h4, p, ul, ol, aside'));

        elements.forEach(el => {
          const tag = el.tagName.toLowerCase();

          if (['h2', 'h3', 'h4'].includes(tag)) {
            if (currentSec.description_text.trim() || currentSec.guidance.length > 0) {
              secList.push(currentSec);
            }
            const headingText = el.innerText.trim();
            currentSec = {
              subsection: subTitle,
              section_heading: headingText,
              description_text: '',
              guidance: []
            };
          } else if (tag === 'p') {
            const fullText = el.innerText.trim();
            if (!fullText) return;

            const firstStrong = el.querySelector('strong, b, em');
            let strongText = firstStrong ? firstStrong.innerText.trim() : '';

            if (strongText && strongText.length > 3 && fullText.startsWith(strongText)) {
              currentSec.guidance.push({
                leadText: strongText,
                fullText: fullText
              });
            } else {
              if (currentSec.description_text) {
                currentSec.description_text += '\n\n' + fullText;
              } else {
                currentSec.description_text = fullText;
              }
            }
          } else if (tag === 'ul' || tag === 'ol') {
            const items = Array.from(el.querySelectorAll(':scope > li'))
              .map(li => '- ' + li.innerText.trim())
              .filter(t => t.length > 2);
            if (items.length > 0) {
              const listBlock = items.join('\n');
              if (currentSec.description_text) {
                currentSec.description_text += '\n\n' + listBlock;
              } else {
                currentSec.description_text = listBlock;
              }
            }
          } else if (tag === 'aside') {
            const asideText = el.innerText.trim();
            if (asideText) {
              if (currentSec.description_text) {
                currentSec.description_text += '\n\n[Note: ' + asideText + ']';
              } else {
                currentSec.description_text = '[Note: ' + asideText + ']';
              }
            }
          }
        });

        if (currentSec.description_text.trim() || currentSec.guidance.length > 0) {
          secList.push(currentSec);
        }

        return secList;
      }, sub.title);

      extractedSecs.forEach(sec => {
        sec.guidance = (sec.guidance || []).map(g => ({
          type: classifyGuidance(g.leadText, g.fullText),
          rule: g.leadText,
          details: g.fullText
        }));
        allSections.push(sec);
      });
    }

    await page.close();

    const structuredOutput = {
      url: targetUrl,
      title: "Navigation and search",
      extracted_at: new Date().toISOString(),
      rendering_mode: "browser-based",
      subsections_count: NAVIGATION_SEARCH_SUBSECTIONS.length,
      sections_count: allSections.length,
      sections: allSections
    };

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(structuredOutput, null, 2), 'utf-8');
    console.log(`[Browser Collector] Saved ${allSections.length} sections across 5 subsections to ${outputFile}`);
  } else {
    console.log(`[Browser Collector] Rendering '${slug}' (${targetUrl})...`);
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));

    const pageTitle = await page.title();

    const sections = await page.evaluate(() => {
      const main = document.querySelector('main, article, div[role="main"]') || document.body;
      const secList = [];

      let currentSec = {
        section_heading: 'Overview',
        description_text: '',
        guidance: []
      };

      const elements = Array.from(main.querySelectorAll('h2, h3, h4, p, ul, ol, aside'));

      elements.forEach(el => {
        const tag = el.tagName.toLowerCase();

        if (['h2', 'h3', 'h4'].includes(tag)) {
          if (currentSec.description_text.trim() || currentSec.guidance.length > 0) {
            secList.push(currentSec);
          }
          const headingText = el.innerText.trim();
          currentSec = {
            section_heading: headingText,
            description_text: '',
            guidance: []
          };
        } else if (tag === 'p') {
          const fullText = el.innerText.trim();
          if (!fullText) return;

          const firstStrong = el.querySelector('strong, b, em');
          let strongText = firstStrong ? firstStrong.innerText.trim() : '';

          if (strongText && strongText.length > 3 && fullText.startsWith(strongText)) {
            currentSec.guidance.push({
              leadText: strongText,
              fullText: fullText
            });
          } else {
            if (currentSec.description_text) {
              currentSec.description_text += '\n\n' + fullText;
            } else {
              currentSec.description_text = fullText;
            }
          }
        } else if (tag === 'ul' || tag === 'ol') {
          const items = Array.from(el.querySelectorAll(':scope > li'))
            .map(li => '- ' + li.innerText.trim())
            .filter(t => t.length > 2);
          if (items.length > 0) {
            const listBlock = items.join('\n');
            if (currentSec.description_text) {
              currentSec.description_text += '\n\n' + listBlock;
            } else {
              currentSec.description_text = listBlock;
            }
          }
        } else if (tag === 'aside') {
          const asideText = el.innerText.trim();
          if (asideText) {
            if (currentSec.description_text) {
              currentSec.description_text += '\n\n[Note: ' + asideText + ']';
            } else {
              currentSec.description_text = '[Note: ' + asideText + ']';
            }
          }
        }
      });

      if (currentSec.description_text.trim() || currentSec.guidance.length > 0) {
        secList.push(currentSec);
      }

      return secList;
    });

    await page.close();

    sections.forEach(s => {
      s.guidance = (s.guidance || []).map(g => ({
        type: classifyGuidance(g.leadText, g.fullText),
        rule: g.leadText,
        details: g.fullText
      }));
    });

    const structuredOutput = {
      url: targetUrl,
      title: pageTitle.replace(/\s*\|.*/, '').trim(),
      extracted_at: new Date().toISOString(),
      rendering_mode: "browser-based",
      sections_count: sections.length,
      sections: sections
    };

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(structuredOutput, null, 2), 'utf-8');
    console.log(`[Browser Collector] Saved ${sections.length} sections to ${outputFile}`);
  }
}

async function main() {
  if (!puppeteer) {
    throw new Error('Puppeteer package is required for browser-based HIG collector execution.');
  }

  console.log(`[Browser Collector] Launching browser session...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const slugsToProcess = targetSlug === 'all' ? HIG_PAGES : [targetSlug];

  for (const slug of slugsToProcess) {
    await collectPage(browser, slug);
  }

  await browser.close();
  console.log(`[Browser Collector] Finished processing all requested HIG pages.`);
}

main().catch(err => {
  console.error('[Browser Collector] Error:', err);
  process.exit(1);
});
