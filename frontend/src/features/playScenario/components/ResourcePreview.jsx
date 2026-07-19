import React from "react";
import MDTextViewer from "./MDTextViewer";
import { useQuery } from "@tanstack/react-query";

async function loadText(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`failed to load file (${res.status})`);
    return res.text();
  });
}

export default function ResourcePreview({ file }) {
  const text = useQuery({
    queryKey: ["file-text", file?.url],
    queryFn: () => loadText(file.url),
    enabled: !!(file?.contentType?.startsWith("text") && file?.url),
  });

  if (!file) {
    return (
      <div className="p-3 h-full flex items-center justify-center text-center opacity-70">
        <div>
          <div className="text-sm">Select a file to preview.</div>
          <div className="text-xs">
            Select a file to preview. Images and PDFs files show inline;
            Text/Markdown render below; other files provide a download.
          </div>
        </div>
      </div>
    );
  }

  const isImage = file.fileType === "image";
  const isText =
    file.fileType === "document" && file.contentType !== "application/pdf";
  const isPDF = file.contentType === "application/pdf";

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
        </div>
        {file.url && (
          <a className="btn btn-phantom btn-xs" href={file.url} download>
            Download
          </a>
        )}
      </div>
      <div className="flex-1 min-h-0">
        {isImage ? (
          <img
            src={file.url}
            alt={file.name}
            className="rounded-xl max-h-80 object-contain"
          />
        ) : isPDF ? (
          <div className="w-full h-full">
            <iframe
              src={file.url}
              title={file.name}
              className="w-full h-full min-h-[60vh] rounded-xl border"
            />
          </div>
        ) : isText && text.isLoading ? (
          <div className="space-y-2">
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-48 w-full" />
          </div>
        ) : isText && text.isError ? (
          <div className="alert alert-warning">
            <span>{text.error?.message || "Failed to load preview."}</span>
          </div>
        ) : isText ? (
          <MDTextViewer file={file} content={text.data} />
        ) : (
          <div className="alert">
            <span>
              Preview not supported. You can download the file instead.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
