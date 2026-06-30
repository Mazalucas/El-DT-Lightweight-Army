import { escapeHtml } from './ui.js';

type ListItem = { indent: number; html: string };

function inlineMarkdown(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  return s;
}

function buildListHtml(items: ListItem[], type: 'ul' | 'ol'): string {
  let html = `<${type}>`;
  let lastIndent = 0;
  for (const item of items) {
    if (item.indent > lastIndent) html += `<${type}>`;
    else if (item.indent < lastIndent) html += `</${type}>`.repeat(lastIndent - item.indent);
    html += `<li>${item.html}</li>`;
    lastIndent = item.indent;
  }
  html += `</${type}>`.repeat(lastIndent + 1);
  return html;
}

/** Subset markdown → safe HTML for assistant/chat surfaces. */
export function renderMarkdown(md: string): string {
  if (!md) return '';

  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  let inCode = false;
  let codeBuf: string[] = [];
  let paraBuf: string[] = [];
  let listBuf: ListItem[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let quoteBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p>${inlineMarkdown(paraBuf.join(' '))}</p>`);
      paraBuf = [];
    }
  };

  const flushList = () => {
    if (listBuf.length && listType) {
      out.push(buildListHtml(listBuf, listType));
      listBuf = [];
      listType = null;
    }
  };

  const flushQuote = () => {
    if (quoteBuf.length) {
      out.push(`<blockquote>${quoteBuf.map((line) => inlineMarkdown(line)).join('<br />')}</blockquote>`);
      quoteBuf = [];
    }
  };

  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (; i < lines.length; i++) {
    const line = lines[i]!;

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      if (!inCode) {
        flushAll();
        inCode = true;
        codeBuf = [];
      } else {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (line.trim() === '') {
      flushAll();
      continue;
    }

    if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) {
      flushAll();
      out.push('<hr />');
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = heading[1]!.length;
      out.push(`<h${level}>${inlineMarkdown(heading[2]!)}</h${level}>`);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushPara();
      flushList();
      quoteBuf.push(quote[1] ?? '');
      continue;
    }
    if (quoteBuf.length) flushQuote();

    const bullet = line.match(/^(\s*)([-*])\s+(.+)$/);
    const ordered = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (bullet || ordered) {
      flushPara();
      flushQuote();
      const match = bullet ?? ordered!;
      const indent = Math.floor(match[1]!.length / 2);
      const type = bullet ? 'ul' : 'ol';
      if (listType && listType !== type) flushList();
      listType = type;
      listBuf.push({ indent, html: inlineMarkdown(match[3]!) });
      continue;
    }

    paraBuf.push(line);
  }

  flushAll();
  if (inCode && codeBuf.length) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }

  return out.join('\n');
}

export function setMarkdownContent(el: HTMLElement, md: string): void {
  el.innerHTML = renderMarkdown(md);
}
