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
  'navigation-and-search',
  'alerts',
  'modality',
  'sheets',
  'popovers',
  'icons'
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

function formatGuidanceString(type, fullText) {
  const lowerText = fullText.toLowerCase();
  if (lowerText.startsWith('do:') || lowerText.startsWith("don't:") || lowerText.startsWith("don’t:") || lowerText.startsWith('guidance:')) {
    return fullText;
  }
  return `${type}: ${fullText}`;
}

async function collectPage(browser, slug) {
  const targetUrl = `https://developer.apple.com/design/human-interface-guidelines/${slug}`;
  const outputFile = path.join(OUTPUT_DIR, `${slug}.json`);

  if (slug === 'navigation-and-search') {
    console.log(`[Browser Collector] Collecting 'navigation-and-search' across 5 subsections...`);
    const page = await browser.newPage();
    const normalizedSections = [];

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
        const heading = sec.section_heading.startsWith(sub.title) 
          ? sec.section_heading 
          : `${sub.title} — ${sec.section_heading}`;

        const guidanceStrings = (sec.guidance || []).map(g => {
          const type = classifyGuidance(g.leadText, g.fullText);
          return formatGuidanceString(type, g.fullText);
        });

        normalizedSections.push({
          heading: heading,
          description: sec.description_text,
          guidance: guidanceStrings
        });
      });
    }

    await page.close();

    const normalizedOutput = {
      page: slug,
      url: targetUrl,
      sections: normalizedSections
    };

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(normalizedOutput, null, 2), 'utf-8');
    console.log(`[Browser Collector] Saved ${normalizedSections.length} sections across 5 subsections to ${outputFile}`);
  } else {
    console.log(`[Browser Collector] Rendering '${slug}' (${targetUrl})...`);
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));

    const extractedSecs = await page.evaluate(() => {
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

    const normalizedSections = extractedSecs.map(s => {
      const guidanceStrings = (s.guidance || []).map(g => {
        const type = classifyGuidance(g.leadText, g.fullText);
        return formatGuidanceString(type, g.fullText);
      });

      return {
        heading: s.section_heading,
        description: s.description_text,
        guidance: guidanceStrings
      };
    });

    const normalizedOutput = {
      page: slug,
      url: targetUrl,
      sections: normalizedSections
    };

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(normalizedOutput, null, 2), 'utf-8');
    console.log(`[Browser Collector] Saved ${normalizedSections.length} sections to ${outputFile}`);
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

  const slugsToProcess = targetSlug === 'all' ? HIG_PAGES : targetSlug.split(',');

  for (const slug of slugsToProcess) {
    await collectPage(browser, slug.trim());
  }

  await browser.close();
  console.log(`[Browser Collector] Finished processing requested HIG pages.`);
}

main().catch(err => {
  console.error('[Browser Collector] Error:', err);
  process.exit(1);
});
