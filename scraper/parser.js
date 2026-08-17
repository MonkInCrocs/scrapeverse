/**
 * Bright Data Scraper Studio - Parser Code
 * Parses Apple Human Interface Guidelines (HIG) Buttons page HTML / Cheerio DOM.
 * Extracts: section heading, description text, and Do/Don't guidance as structured JSON.
 */

function parseAppleHIGButtons() {
  const pageTitle = $('title').text().replace(/\s*\|.*/, '').trim() || 'Buttons';
  const url = 'https://developer.apple.com/design/human-interface-guidelines/buttons';

  const sections = [];
  let currentSection = {
    section_heading: 'Overview',
    description_text: '',
    guidance: []
  };

  function classifyGuidance(text) {
    const lower = text.toLowerCase().trim();
    if (lower.startsWith("don't") || lower.startsWith("don’t") || lower.includes("don't") || lower.includes("don’t") || lower.startsWith("avoid")) {
      return "Don't";
    } else if (lower.startsWith("do") || lower.startsWith("prefer") || lower.startsWith("use") || lower.startsWith("ensure") || lower.startsWith("make") || lower.startsWith("provide") || lower.startsWith("always")) {
      return "Do";
    }
    return "Guidance";
  }

  $('main, article, body').find('h2, h3, h4, p, ul, ol, aside, div.do-dont').each((i, el) => {
    const tagName = el.tagName ? el.tagName.toLowerCase() : '';
    const $el = $(el);

    if (['h2', 'h3', 'h4'].includes(tagName)) {
      if (currentSection.description_text || currentSection.guidance.length > 0) {
        sections.push(currentSection);
      }
      const headingText = $el.text().trim();
      currentSection = {
        section_heading: headingText,
        description_text: '',
        guidance: []
      };
    } else if (tagName === 'p') {
      const text = $el.text().trim();
      if (!text) return;

      const strongText = $el.find('strong, b, em').first().text().trim();
      if (strongText && strongText.length > 5) {
        const guidanceType = classifyGuidance(strongText);
        currentSection.guidance.push({
          type: guidanceType,
          rule: strongText,
          details: text
        });
      } else {
        if (currentSection.description_text) {
          currentSection.description_text += '\n\n' + text;
        } else {
          currentSection.description_text = text;
        }
      }
    } else if (['ul', 'ol'].includes(tagName)) {
      const items = [];
      $el.find('li').each((_, li) => {
        const itemText = $(li).text().trim();
        if (itemText) items.push('- ' + itemText);
      });
      if (items.length > 0) {
        const listBlock = items.join('\n');
        if (currentSection.description_text) {
          currentSection.description_text += '\n' + listBlock;
        } else {
          currentSection.description_text = listBlock;
        }
      }
    } else if (tagName === 'aside') {
      const asideText = $el.text().trim();
      if (asideText) {
        currentSection.description_text += '\n\n[Note: ' + asideText + ']';
      }
    }
  });

  if (currentSection.description_text || currentSection.guidance.length > 0) {
    sections.push(currentSection);
  }

  return {
    url: url,
    title: pageTitle,
    extracted_at: new Date().toISOString(),
    sections_count: sections.length,
    sections: sections
  };
}

return parseAppleHIGButtons();
