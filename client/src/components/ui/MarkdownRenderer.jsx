import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) return null;

  // Pre-process mentions: @[Name](email) -> превращаем в специальный формат, который мы можем поймать
  // We'll use a unique prefix for mention links to distinguish them from regular links
  const processedContent = content.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, (match, name, email) => {
    return `[MENTION:${name}](mailto:${email})`;
  });

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Styled Bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-zinc-900" {...props} />
          ),
          // Styled Italic
          em: ({ node, ...props }) => (
            <em className="italic font-medium text-zinc-800" {...props} />
          ),
          // Styled Links & Mentions
          a: ({ node, children, ...props }) => {
            const isMention = children && typeof children[0] === 'string' && children[0].startsWith('MENTION:');
            
            if (isMention) {
              const name = children[0].replace('MENTION:', '');
              return (
                <span className="inline-flex items-center px-1.5 py-0.5 bg-zinc-900 text-[#fffe01] rounded-[6px] font-medium text-[11px] border border-zinc-800 cursor-default shadow-sm mx-0.5 select-none">
                  @{name}
                </span>
              );
            }

            return (
              <a
                className="text-[#0052cc] hover:underline cursor-pointer font-bold decoration-[1.5px] transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Styled Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc ml-4 space-y-1 mb-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal ml-4 space-y-1 mb-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-[14px] leading-relaxed font-normal text-zinc-700" {...props} />
          ),
          // Styled Paragraphs
          p: ({ node, ...props }) => (
            <p className="leading-relaxed mb-1" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
