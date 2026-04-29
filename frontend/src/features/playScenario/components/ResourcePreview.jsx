import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import FileViewer from "./FileViewer";

export default function ResourcePreview({ file, getDownloadUrl }) {
  const [url, setUrl] = useState(null);
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      setUrl(null);
      setText(null);
      setFetchErr(null);
      if (!file) return;

      try {
        setLoading(true);
        const u = await getDownloadUrl(file.id);
        if (cancelled) return;
        setUrl(u);

        // Fetch text content only for text-like types
        const isText =
          file.type?.startsWith("text/") ||
          /json|xml|csv/.test(file.type || "") ||
          /\.md$|\.html?$/i.test(file.name || "");
        if (isText) {
          const resp = await fetch(u);
          if (!resp.ok) throw new Error(`Failed to fetch (${resp.status})`);
          const t = await resp.text();
          if (!cancelled) setText(t); // safety cap
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          const msg = err?.message || "Failed to load preview";
          setFetchErr(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    prepare();
    return () => {
      cancelled = true;
    };
  }, [file, getDownloadUrl]);

  if (!file) {
    return (
      <div className="p-3 h-full flex items-center justify-center text-center opacity-70">
        <div>
          <div className="text-sm">Select a file to preview.</div>
          <div className="text-xs">
            Images and PDFs files show inline; text/CSV/JSON/Markdown render
            below; other files provide a download.
          </div>
        </div>
      </div>
    );
  }

  const isImage = file.type?.startsWith("image/");
  const isPDF = file.type === "application/pdf";
  const isText =
    file.type?.startsWith("text/") || /json|xml|csv/.test(file.type || "");
  const isMarkdown =
    file.type === "text/markdown" || /\.md$/i.test(file.name || "");
  const isHTML = file.type === "text/html" || /\.html?$/i.test(file.name || "");

  return (
    <div className="p-3 h-full flex flex-col gap-3 font-ibm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3
            className="font-dm text-l text-base-content truncate"
            title={file.name}
          >
            {file.name}
          </h3>
          <div className="text-xs opacity-70 text-primary">
            {file.groupName} / {file.childName}
          </div>
        </div>
        {url && (
          <a className="btn btn-phantom btn-xs" href={url} download>
            Download
          </a>
        )}
      </div>
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-48 w-full" />
            <div className="skeleton h-4 w-1/4" />
          </div>
        ) : fetchErr ? (
          <div className="alert alert-warning">
            <span>{fetchErr}</span>
          </div>
        ) : isImage && url ? (
          <div className="w-full h-full overflow-auto">
            <img
              src={url}
              alt={file.name}
              className="rounded-xl max-h-[60vh] object-contain mx-auto"
            />
          </div>
        ) : isPDF && url ? (
          <div className="w-full h-full">
            <iframe
              src={url}
              title={file.name}
              className="w-full h-full min-h-[60vh] rounded-xl border"
            />
          </div>
        ) : (isText || isMarkdown || isHTML) && url ? (
          <FileViewer
            file={file}
            content={text}
            loading={loading}
            error={fetchErr}
          />
        ) : url ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-sm opacity-70">
              Preview not supported. Use the download button.
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-sm opacity-70">No preview available.</div>
          </div>
        )}
      </div>
    </div>
  );
}
