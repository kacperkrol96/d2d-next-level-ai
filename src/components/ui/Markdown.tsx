import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Treść w Markdown (kontrakt, lekcje Akademii) — renderowana na serwerze, bez surowego HTML. */
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children }) => <span className="underline decoration-dotted">{children}</span>,
          img: () => null,
          table: ({ children }) => (
            <div className="md-table">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
