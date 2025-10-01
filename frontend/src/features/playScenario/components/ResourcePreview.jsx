import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
        const isText = file.type?.startsWith("text/") || /json|xml|csv/.test(file.type || "");
        if (isText) {
          const resp = await fetch(u);
          if (!resp.ok) throw new Error(`Failed to fetch (${resp.status})`);
          const t = await resp.text();
          if (!cancelled) setText(t.slice(0, 5000)); // safety cap
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
          <div className="text-xs">Images show inline; text/CSV/JSON render below; other files provide a download.</div>
        </div>
      </div>
    );
  }

  const isImage = file.type?.startsWith("image/");
  const isText = file.type?.startsWith("text/") || /json|xml|csv/.test(file.type || "");

  return (
    <div className="p-3 h-full flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold truncate" title={file.name}>{file.name}</div>
          <div className="text-xs opacity-70">
            {file.groupName} / {file.childName}
          </div>
        </div>
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
            <img src={url} alt={file.name} className="rounded-xl max-h-[60vh] object-contain mx-auto" />
          </div>
        ) : isText && url ? (
          <pre className="mockup-code whitespace-pre-wrap text-xs max-h-[60vh] overflow-auto p-3">
            {text || "(empty)"}
          </pre>
        ) : url ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-sm opacity-70">Preview not supported. Use the download button.</div>
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

function formatBytes(n) {
  if (!Number.isFinite(n)) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (n < k) return `${n} B`;
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}
