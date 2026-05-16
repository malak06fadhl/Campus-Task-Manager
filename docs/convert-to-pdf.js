const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

async function convertMarkdownToPDF(mdFilePath, outputPdfPath) {
  try {
    // Read markdown file
    const markdown = fs.readFileSync(mdFilePath, 'utf-8');
    
    // Convert markdown to HTML
    const html = marked(markdown);
    
    // Create full HTML document with styling
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
    }
    h1 {
      color: #2f6fe4;
      border-bottom: 3px solid #2f6fe4;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    h2 {
      color: #1a56c4;
      border-bottom: 2px solid #eaf1ff;
      padding-bottom: 8px;
      margin-top: 25px;
    }
    h3 {
      color: #2f6fe4;
      margin-top: 20px;
    }
    code {
      background: #f4f6fb;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background: #f4f6fb;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      border-left: 4px solid #2f6fe4;
    }
    pre code {
      background: none;
      padding: 0;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 30px;
    }
    li {
      margin: 5px 0;
    }
    blockquote {
      border-left: 4px solid #2f6fe4;
      padding-left: 20px;
      margin: 20px 0;
      color: #6c7a92;
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e9edf5;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #eaf1ff;
      color: #2f6fe4;
      font-weight: 600;
    }
    a {
      color: #2f6fe4;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 2px solid #e9edf5;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `;
    
    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    
    console.log(`✓ PDF created: ${outputPdfPath}`);
    return true;
  } catch (error) {
    console.error(`✗ Error converting ${mdFilePath}:`, error.message);
    return false;
  }
}

// Main execution
async function main() {
  const specsDir = path.join(__dirname, '..', '.kiro', 'specs');
  const outputDir = path.join(__dirname, '..', 'docs', 'pdf-exports');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Find all markdown files in specs
  const specs = ['ai-support-assistant', 'studybalance'];
  const files = ['requirements.md', 'design.md', 'tasks.md'];
  
  console.log('Converting markdown files to PDF...\n');
  
  for (const spec of specs) {
    for (const file of files) {
      const mdPath = path.join(specsDir, spec, file);
      if (fs.existsSync(mdPath)) {
        const pdfName = `${spec}-${file.replace('.md', '.pdf')}`;
        const pdfPath = path.join(outputDir, pdfName);
        await convertMarkdownToPDF(mdPath, pdfPath);
      }
    }
  }
  
  console.log(`\n✓ All PDFs saved to: ${outputDir}`);
}

main().catch(console.error);
