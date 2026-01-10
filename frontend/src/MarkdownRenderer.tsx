import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown.css';

type MarkdownRendererProps = {
  content: string;
};

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body" style={{ padding: 0 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;