import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

function renderMarkdown(content) {
  if (!content) return "";
  const html = marked.parse(content, { headerIds: false });
  return DOMPurify.sanitize(html);
}

function renderHTML(content) {
  if (!content) return "";
  return DOMPurify.sanitize(content);
}

export default function FileViewer({ file, content, loading, error }) {
  const isMarkdown =
    file.type === "text/markdown" || /\.md$/i.test(file.name || "");
  const isHTML = file.type === "text/html" || /\.html?$/i.test(file.name || "");

  const renderedHTML = useMemo(() => {
    if (isMarkdown) return renderMarkdown(content);
    if (isHTML) return renderHTML(content);
    return null;
  }, [content, isMarkdown, isHTML]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="skeleton h-6 w-1/2" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning">
        <span>{error}</span>
      </div>
    );
  }

  if (isMarkdown || isHTML) {
    return (
      <div className="prose prose-sm max-h-[60vh] overflow-auto rounded-xl border p-3 bg-base-200">
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
