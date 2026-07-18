import { useQuery } from "@tanstack/react-query";
import MDTextViewer from "../playScenario/components/MDTextViewer";

async function loadText(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`failed to load file (${res.status})`);
    return res.text();
  });
}

function ResourcePreview({ file }) {
  const text = useQuery({
    queryKey: ["file-text", file?.url],
    queryFn: () => loadText(file.url),
    enabled: !!(file?.contentType?.startsWith("text") && file?.url),
  });

  if (!file)
    return (
      <div className="prose max-w-none opacity-70">
        <h3>Preview</h3>
        <p>
          Select a file to preview. Images and PDFs files show inline;
          Text/Markdown render below; other files provide a download.
        </p>
      </div>
    );

  const isImage = file.fileType === "image";
  const isText =
    file.fileType === "document" && file.contentType !== "application/pdf";
  const isPDF = file.contentType === "application/pdf";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-m">{file.name}</h3>
        <a className="btn btn-phantom btn-xs" href={file.url} download>
          Download
        </a>
      </div>

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
          <span>Preview not supported. You can download the file instead.</span>
        </div>
      )}
    </div>
  );
}

export default ResourcePreview;
