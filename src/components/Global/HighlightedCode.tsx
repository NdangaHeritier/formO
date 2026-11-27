"use client";
import { Highlight, type Language, type PrismTheme } from "prism-react-renderer";

/** FormO palette for code: zinc text, amber keywords, green strings. */
export const formoCodeTheme: PrismTheme = {
  plain: { color: "#e4e4e7", backgroundColor: "transparent" },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#71717a", fontStyle: "italic" },
    },
    { types: ["punctuation"], style: { color: "#a1a1aa" } },
    { types: ["keyword", "operator", "tag", "selector", "atrule"], style: { color: "#fbbf24" } },
    { types: ["function", "class-name", "attr-name", "builtin"], style: { color: "#93c5fd" } },
    { types: ["string", "attr-value", "char", "url"], style: { color: "#86efac" } },
    { types: ["number", "boolean", "constant", "symbol"], style: { color: "#c4b5fd" } },
    { types: ["variable", "parameter", "property"], style: { color: "#e4e4e7" } },
    { types: ["deleted"], style: { color: "#fca5a5" } },
    { types: ["inserted"], style: { color: "#86efac" } },
  ],
};

export default function HighlightedCode({
  code,
  language = "bash",
  className = "text-[13px] leading-6",
}: {
  code: string;
  language?: Language;
  className?: string;
}) {
  return (
    <Highlight theme={formoCodeTheme} code={code.trimEnd()} language={language}>
      {({ className: prismClass, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${prismClass} overflow-x-auto font-mono ${className}`}>
          {tokens.map((line, lineIndex) => {
            const lineProps = getLineProps({ line });
            return (
              <div key={lineIndex} {...lineProps}>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} {...getTokenProps({ token })} />
                ))}
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
