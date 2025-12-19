import { NextRequest, NextResponse } from 'next/server';
import { getLeadMagnetBySlug } from '@/lib/lead-magnets';

// Serve lead magnet content as HTML for printing/saving as PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const leadMagnet = getLeadMagnetBySlug(slug);
  if (!leadMagnet) {
    return NextResponse.json(
      { error: 'Lead magnet not found' },
      { status: 404 }
    );
  }

  // Convert markdown to simple HTML
  const htmlContent = markdownToHtml(leadMagnet.content);

  // Create a printable HTML page
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${leadMagnet.title} | Integrated Human</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500&family=Inter:wght@400;500;600&display=swap');

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.7;
      color: #1a1a1a;
      max-width: 700px;
      margin: 0 auto;
      padding: 40px 24px;
      background: #fff;
    }

    h1, h2, h3 {
      font-family: 'Crimson Pro', Georgia, serif;
      font-weight: 400;
      line-height: 1.3;
      margin-top: 2em;
      margin-bottom: 0.5em;
    }

    h1 {
      font-size: 2.5em;
      margin-top: 0;
      padding-bottom: 0.5em;
      border-bottom: 1px solid #e5e5e5;
    }

    h2 {
      font-size: 1.75em;
      color: #333;
    }

    h3 {
      font-size: 1.25em;
      color: #444;
    }

    p {
      margin: 1em 0;
    }

    ul, ol {
      margin: 1em 0;
      padding-left: 1.5em;
    }

    li {
      margin: 0.5em 0;
    }

    hr {
      border: none;
      border-top: 1px solid #e5e5e5;
      margin: 2em 0;
    }

    strong {
      font-weight: 600;
    }

    em {
      font-style: italic;
    }

    blockquote {
      margin: 1.5em 0;
      padding: 1em 1.5em;
      border-left: 3px solid #333;
      background: #f9f9f9;
      font-style: italic;
    }

    code {
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }

    .checkbox {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #666;
      border-radius: 3px;
      margin-right: 8px;
      vertical-align: middle;
    }

    .header {
      text-align: center;
      margin-bottom: 2em;
    }

    .header img {
      max-width: 120px;
      margin-bottom: 1em;
    }

    .footer {
      margin-top: 3em;
      padding-top: 2em;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }

    .print-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #18181b;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .print-button:hover {
      background: #27272a;
    }

    @media print {
      .print-button {
        display: none;
      }

      body {
        padding: 0;
      }

      h1, h2, h3 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${leadMagnet.title}</h1>
    <p style="color: #666; font-size: 0.9em;">From Integrated Human • integratedhuman.me</p>
  </div>

  ${htmlContent}

  <div class="footer">
    <p>© Integrated Human</p>
    <p>Visit <strong>integratedhuman.me</strong> for more resources on integration, healing, and becoming whole.</p>
  </div>

  <button class="print-button" onclick="window.print()">
    Print / Save as PDF
  </button>
</body>
</html>
`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Checkboxes (□)
  html = html.replace(/□/g, '<span class="checkbox"></span>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Clean up empty paragraphs around block elements
  html = html.replace(/<p><h([1-3])>/g, '<h$1>');
  html = html.replace(/<\/h([1-3])><\/p>/g, '</h$1>');
  html = html.replace(/<p><hr><\/p>/g, '<hr>');
  html = html.replace(/<p><\/p>/g, '');

  // Lists (basic)
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>');

  return html;
}
