const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');

function formatGuidanceItem(g) {
  if (typeof g === 'string') {
    return g;
  }
  if (!g) return '';
  const type = g.type || 'Guidance';
  const text = g.details || g.rule || g.text || '';
  if (!text) return '';
  
  // Avoid duplicate prefixing if text already starts with "Do:", "Don't:", etc.
  const lowerText = text.toLowerCase();
  if (lowerText.startsWith('do:') || lowerText.startsWith("don't:") || lowerText.startsWith("don’t:") || lowerText.startsWith('guidance:')) {
    return text;
  }
  
  return `${type}: ${text}`;
}

function normalizeFile(filePath) {
  const fileName = path.basename(filePath);
  const pageSlug = fileName.replace('.json', '');
  
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(rawContent);
  } catch (e) {
    console.error(`Failed to parse ${fileName}:`, e.message);
    return;
  }

  const page = data.page || pageSlug;
  const url = data.url || `https://developer.apple.com/design/human-interface-guidelines/${pageSlug}`;

  const rawSections = data.sections || [];
  const normalizedSections = rawSections.map(sec => {
    const subsection = sec.subsection ? `${sec.subsection} — ` : '';
    const rawHeading = sec.heading || sec.section_heading || 'Overview';
    const heading = sec.subsection && !rawHeading.startsWith(sec.subsection) 
      ? `${sec.subsection} — ${rawHeading}` 
      : rawHeading;
      
    const description = sec.description !== undefined ? sec.description : (sec.description_text || '');

    const rawGuidance = sec.guidance || [];
    const guidance = Array.isArray(rawGuidance) 
      ? rawGuidance.map(formatGuidanceItem).filter(g => g.length > 0)
      : [];

    return {
      heading: heading,
      description: description,
      guidance: guidance
    };
  });

  const normalizedData = {
    page: page,
    url: url,
    sections: normalizedSections
  };

  fs.writeFileSync(filePath, JSON.stringify(normalizedData, null, 2), 'utf-8');
  console.log(`[Normalized] ${fileName}: ${normalizedSections.length} sections`);
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error(`Output directory does not exist: ${OUTPUT_DIR}`);
    return;
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
  console.log(`Normalizing ${files.length} JSON files in ${OUTPUT_DIR}...`);

  files.forEach(file => {
    normalizeFile(path.join(OUTPUT_DIR, file));
  });

  console.log('All files successfully normalized.');
}

main();
