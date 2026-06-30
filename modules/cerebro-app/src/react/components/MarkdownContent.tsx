import { renderMarkdown } from '../../lib/render-markdown.js';

export function MarkdownContent({
  content,
  className = 'md-content',
}: {
  content: string;
  className?: string;
}) {
  if (!content) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
}
