import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api } from "../../util/api";

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

export function useResourceEditing(file) {
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

  function cancelEdit() {
    setEditing(false);
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

  return {
    canPreviewText,
    canEdit,
    text,
    editing,
    draft,
    setDraft,
    saving,
    startEdit,
    cancelEdit,
    saveEdit,
  };
}