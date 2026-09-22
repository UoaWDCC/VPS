import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api } from "../../util/api";
import MDTextViewer from "../playScenario/components/MDTextViewer";
import { MDEditor } from "../playScenario/components/MDEditor";

async function loadText(url) {
  return fetch(url, { cache: "no-store" }).then((res) => {
    if (!res.ok) throw new Error(`failed to load file (${res.status})`);
    return res.text();
  });
}

function isEditableText(file) {
  return (
    file?.fileType === "document" &&
    (file?.contentType === "text/markdown" ||
      file?.contentType === "text/plain" ||
      /\.md$/i.test(file?.name || ""))
  );
}

function ResourcePreview({ file }) {
  const { scenarioId } = useParams();
  const { user } = useContext(AuthenticationContext);
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const canPreviewText = !!(
    file?.fileType === "document" &&
    file?.contentType?.startsWith("text") &&
    file?.url
  );
  const canEdit = isEditableText(file) && !!file?.fileId && !!file?.url;

  const text = useQuery({
    queryKey: ["file-text", file?.url],
    queryFn: () => loadText(file.url),
    enabled: canPreviewText,
  });

  useEffect(() => {
    setEditing(false);
    setDraft("");
  }, [file?._id]);

  function startEdit() {
    setDraft(text.data ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    if (saving || !file?.fileId) return;
    setSaving(true);
    try {
      await api.put(user, `/api/files/${scenarioId}/${file.fileId}`, {
        content: draft,
      });
      await queryClient.invalidateQueries(["file-text", file.url]);
      setEditing(false);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save file");
    } finally {
      setSaving(false);
    }
  }

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
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-m truncate">{file.name}</h3>
        <div className="flex gap-1">
          {canEdit && !editing && (
            <button
              type="button"
              className="btn btn-phantom btn-xs"
              onClick={startEdit}
              disabled={text.isLoading}
            >
              Edit
            </button>
          )}
          {editing && (
            <>
              <button
                type="button"
                className="btn btn-phantom btn-xs"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-xs btn-primary"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
          <a className="btn btn-phantom btn-xs" href={file.url} download>
            Download
          </a>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {editing ? (
          <MDEditor value={draft} onChange={setDraft} height="50vh" />
        ) : isImage ? (
          <img
            src={file.url}
            alt={file.name}
            className="rounded-xl object-contain max-h-full h-full w-full"
          />
        ) : isPDF ? (
          <div className="h-full min-h-0 w-full">
            <iframe
              src={file.url}
              title={file.name}
              className="block h-full min-h-[50dvh] w-full rounded-xl border border-primary lg:min-h-0"
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
