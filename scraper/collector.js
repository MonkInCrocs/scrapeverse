const fs = require('fs');
const path = require('path');
const https = require('https');

const slug = process.argv[2] || 'buttons';

const TARGET_URL = `https://developer.apple.com/design/human-interface-guidelines/${slug}`;
const DATA_API_URL = `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/${slug}.json`;
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `${slug}.json`);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function extractInlineText(inlineList) {
  if (!Array.isArray(inlineList)) return '';
  return inlineList.map(item => {
    if (!item) return '';
    if (item.text) return item.text;
    if (item.inlineContent) return extractInlineText(item.inlineContent);
    return '';
  }).join('');
}

function classifyGuidance(ruleText, fullText) {
  const lowerRule = ruleText.toLowerCase();
  if (lowerRule.startsWith("don’t") || lowerRule.startsWith("don't") || lowerRule.includes("don't") || lowerRule.includes("don’t") || lowerRule.startsWith("avoid")) {
    return "Don't";
  } else if (lowerRule.startsWith("do") || lowerRule.startsWith("prefer") || lowerRule.startsWith("use") || lowerRule.startsWith("make") || lowerRule.startsWith("provide") || lowerRule.startsWith("ensure") || lowerRule.startsWith("always")) {
    return "Do";
  }
  return "Guidance";
}

async function runCollector() {
  console.log(`[Bright Data Collector] Fetching Apple HIG data for '${slug}' from ${DATA_API_URL}...`);
  const rawData = await fetchJson(DATA_API_URL);

  const sections = [];
  let currentSection = {
    section_heading: 'Overview',
    description_text: '',
    guidance: []
  };

  const abstractText = extractInlineText(rawData.abstract || []);
  if (abstractText) {
    currentSection.description_text = abstractText;
  }

  const primaryContent = rawData.primaryContentSections && rawData.primaryContentSections[0] 
    ? rawData.primaryContentSections[0].content || []
    : [];

  const references = rawData.references || {};

  function processItems(items, parentHeading = 'Overview') {
    items.forEach(item => {
      const itemType = item.type;

      if (itemType === 'heading') {
        if (currentSection.description_text.trim() || currentSection.guidance.length > 0) {
          sections.push(currentSection);
        }
        const headingText = (item.text || '').trim();
        currentSection = {
          section_heading: headingText,
          description_text: '',
          guidance: []
        };
      } else if (itemType === 'paragraph') {
        const inline = item.inlineContent || [];
        const fullText = extractInlineText(inline).trim();
        if (!fullText) return;

        let hasStrongLead = false;
        let leadText = '';
        if (inline.length > 0 && (inline[0].type === 'strong' || inline[0].type === 'emphasis')) {
          leadText = extractInlineText([inline[0]]).trim();
          if (leadText.length > 3) {
            hasStrongLead = true;
          }
        }

        if (hasStrongLead) {
          const type = classifyGuidance(leadText, fullText);
          currentSection.guidance.push({
            type: type,
            rule: leadText,
            details: fullText
          });
        } else {
          if (currentSection.description_text) {
            currentSection.description_text += '\n\n' + fullText;
          } else {
            currentSection.description_text = fullText;
          }
        }
      } else if (itemType === 'unorderedList') {
        const listItems = item.items || [];
        listItems.forEach(li => {
          (li.content || []).forEach(lic => {
            if (lic.type === 'paragraph') {
              const liText = extractInlineText(lic.inlineContent || []).trim();
              if (liText) {
                if (currentSection.description_text) {
                  currentSection.description_text += '\n- ' + liText;
                } else {
                  currentSection.description_text = '- ' + liText;
                }
              }
            }
          });
        });
      } else if (itemType === 'links') {
        const linkKeys = item.items || [];
        const linksText = linkKeys.map(k => {
          const ref = references[k];
          if (ref) {
            const title = ref.title || k;
            const abs = extractInlineText(ref.abstract || []);
            return `- **${title}**: ${abs}`;
          }
          return `- ${k}`;
        }).join('\n');

        if (linksText) {
          if (currentSection.description_text) {
            currentSection.description_text += '\n\n' + linksText;
          } else {
            currentSection.description_text = linksText;
          }
        }
      } else if (itemType === 'row') {
        (item.columns || []).forEach(col => {
          processItems(col.content || [], parentHeading);
        });
      } else if (itemType === 'aside') {
        const asideName = item.name || 'Note';
        let asideText = '';
        (item.content || []).forEach(ac => {
          if (ac.type === 'paragraph') {
            asideText += extractInlineText(ac.inlineContent || []).trim() + ' ';
          }
        });
        asideText = asideText.trim();
        if (asideText) {
          currentSection.description_text += (currentSection.description_text ? '\n\n' : '') + `[${asideName}: ${asideText}]`;
        }
      }
    });
  }

  processItems(primaryContent);

  // If topicSections exist, list them in Overview or section
  const topicSections = rawData.topicSections || [];
  topicSections.forEach(ts => {
    const topicTitle = ts.title || 'Components';
    const topicIdentifiers = ts.identifiers || [];
    const topicText = topicIdentifiers.map(k => {
      const ref = references[k];
      if (ref) {
        const title = ref.title || k;
        const abs = extractInlineText(ref.abstract || []);
        return `- **${title}**: ${abs}`;
      }
      return `- ${k}`;
    }).join('\n');

    if (topicText && !currentSection.description_text.includes(topicText)) {
      if (currentSection.description_text) {
        currentSection.description_text += `\n\n### ${topicTitle}\n` + topicText;
      } else {
        currentSection.description_text = `### ${topicTitle}\n` + topicText;
      }
    }
  });

  if (currentSection.description_text.trim() || currentSection.guidance.length > 0) {
    sections.push(currentSection);
  }

  const structuredOutput = {
    url: TARGET_URL,
    title: (rawData.metadata && rawData.metadata.title) || slug,
    extracted_at: new Date().toISOString(),
    sections_count: sections.length,
    sections: sections
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(structuredOutput, null, 2), 'utf-8');
  console.log(`[Bright Data Collector] Successfully saved structured data (${sections.length} sections) to ${OUTPUT_FILE}`);
}

runCollector().catch(err => {
  console.error('[Bright Data Collector] Error:', err);
  process.exit(1);
});
