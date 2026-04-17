import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) return null;

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
          // Styled Links
          a: ({ node, ...props }) => (
            <a
              className="text-[#0052cc] hover:underline cursor-pointer font-bold decoration-[1.5px] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // Styled Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc ml-4 space-y-1 mb-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal ml-4 space-y-1 mb-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-[14px] leading-relaxed font-medium text-zinc-700" {...props} />
          ),
          // Styled Paragraphs (to avoid extra margin in lists/bubbles)
          p: ({ node, ...props }) => (
            <p className="leading-relaxed mb-1" {...props} />
          ),
          // Styled Mentions (we'll handle these via a pre-processing step if needed, or by detecting the pattern)
          span: ({ node, className, ...props }) => {
            if (className === 'mention') {
              return (
                <span 
                  className="px-1.5 py-0.5 bg-blue-100 text-[#0052cc] rounded font-bold text-[13px] border border-blue-200 cursor-default hover:bg-blue-200 transition-colors"
                  {...props}
                />
              );
            }
            return <span {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
