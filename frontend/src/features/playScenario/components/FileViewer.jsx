import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

function renderMarkdown(content) {
  if (!content) return "";
  // make headersId to true if you want to use custom headers (need their own ids)
  const html = marked.parse(content, { headerIds: false });
  return DOMPurify.sanitize(html);
}

function renderHTML(content) {
  if (!content) return "";
  return DOMPurify.sanitize(content);
}

// Text and Markdown rendering fucntion (Not really fileviewer there is probably better name since its not universal)
export default function FileViewer({ file, content }) {
  if (!file) return null;

  // networking tab showed backend returning type html so I check for both
  const isMarkdown =
    file.type === "text/markdown" || /\.md$/i.test(file.name || "");
  const isHTML = file.type === "text/html" || /\.html?$/i.test(file.name || "");

  // caches res to avoid frequent updating
  const renderedHTML = useMemo(() => {
    if (isMarkdown) return renderMarkdown(content);
    if (isHTML) return renderHTML(content);
    return null;
  }, [content, isMarkdown, isHTML]);

  if (isMarkdown || isHTML) {
    return (
      <div className="prose prose-sm max-h-[60vh] overflow-auto rounded-xl border p-3 bg-base-200">
        {/* dont worry its purified html 😄*/}
        <div dangerouslySetInnerHTML={{ __html: renderedHTML }} />
      </div>
    );
  }

  return (
    <pre className="mockup-code whitespace-pre-wrap text-xs max-h-[60vh] overflow-auto p-3">
      {content || "(empty)"}
    </pre>
  );
}
