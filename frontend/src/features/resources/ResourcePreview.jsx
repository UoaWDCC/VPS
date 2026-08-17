import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import MDTextViewer from "../playScenario/components/MDTextViewer";

async function loadText(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`failed to load file (${res.status})`);
    return res.text();
  });
}

async function downloadFile(url, name) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to load file (${res.status})`);
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = name || "";
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

function ResourcePreview({ file }) {
  const canPreviewText = !!(
    file?.fileType === "document" &&
    file?.contentType?.startsWith("text") &&
    file?.url
  );

  const text = useQuery({
    queryKey: ["file-text", file?.url],
    queryFn: () => loadText(file.url),
    enabled: canPreviewText,
  });

  if (!file)
    return (
      <div className="prose max-w-none opacity-70">
        <h3>Preview</h3>
        <p>
          Select a file to preview. If a preview is not available, the file can
          be downloaded.
        </p>
      </div>
    );

  const isImage = file.fileType === "image";
  const isText = canPreviewText;
  const isPDF = file.contentType === "application/pdf";

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 font-ibm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-m min-w-0 break-all">{file.name}</h3>
        <button
          type="button"
          className="btn btn-phantom btn-xs shrink-0"
          onClick={() =>
            downloadFile(file.url, file.name).catch((err) => {
              console.error("Failed to download file:", err);
              toast.error("Failed to download file. Please try again.");
            })
          }
        >
          Download
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {isImage ? (
          <img
            src={file.url}
            alt={file.name}
            className="rounded-xl max-h-80 object-contain"
          />
        ) : isPDF ? (
          <div className="h-full min-h-0 w-full">
            <iframe
              src={file.url}
              title={file.name}
              className="block h-full min-h-[50dvh] w-full rounded-xl border lg:min-h-0"
            />
          </div>
        ) : isText && text.isInitialLoading ? (
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

export default ResourcePreview;
