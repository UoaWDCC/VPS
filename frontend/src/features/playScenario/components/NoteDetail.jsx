import React, { useContext, useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import toast from "react-hot-toast";
import AuthenticationContext from "context/AuthenticationContext";

export default function NoteDetail({
  note,
  group,
  userRole,
  onSaved,
  onDeleted,
}) {
  const { user } = useContext(AuthenticationContext);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const canEdit = !!(userRole && note?.role === userRole);
  const authorName =
    group?.users?.find((u) => u.role === note?.role)?.name ?? note?.role ?? "-";

  useEffect(() => {
    if (!note) return;
    setTitle(note.title || "");
    setText(note.text || "");
    setEditing(false);
    setShowConfirm(false);
  }, [note?._id]);

  function handleCancel() {
    setTitle(note.title || "");
    setText(note.text || "");
    setEditing(false);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const token = await getAuth().currentUser.getIdToken();
      await axios.put(
        "/api/note/update",
        {
          noteId: note._id,
          title,
          text,
          groupId: group._id,
          email: user.email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditing(false);
      onSaved?.({ ...note, title, text, date: new Date().toISOString() });
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const token = await getAuth().currentUser.getIdToken();
      await axios.delete("/api/note/delete", {
        data: { noteId: note._id, groupId: group._id, email: user.email },
        headers: { Authorization: `Bearer ${token}` },
      });
      onDeleted?.(note._id);
    } catch {
      toast.error("Failed to delete note");
    }
    setShowConfirm(false);
  }

  if (!note) {
    return (
      <div className="p-3 h-full flex items-center justify-center text-center opacity-70 text-sm">
        Please select a note.
      </div>
    );
  }

  return (
    <div className="p-3 h-full flex flex-col gap-4 font-ibm">
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            className="flex-1 text-xl font-dm bg-base-200 rounded px-2 py-1 outline-none border border-primary"
            value={title}
            maxLength={50}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        ) : (
          <h2 className="text-xl font-dm">{note.title || "Untitled"}</h2>
        )}

        <div className="flex gap-2 shrink-0">
          {canEdit && !editing && (
            <>
              <button
                className="btn btn-phantom btn-xs"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                className="btn btn-phantom btn-xs text-error"
                onClick={() => setShowConfirm(true)}
              >
                Delete
              </button>
            </>
          )}
          {editing && (
            <>
              <button className="btn btn-phantom btn-xs" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="btn btn-xs btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 overflow-auto">
        {editing ? (
          <textarea
            className="w-full bg-base-200 rounded p-2 outline-none border border-primary resize-none text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">
            {note.text || <span className="opacity-50">No content.</span>}
          </p>
        )}
      </div>

      <div className="flex items-end justify-between border-t border-base-200 pt-3 text-sm">
        <div className="flex gap-6">
          <div>
            <div className="text-xs opacity-60">Author</div>
            <div className="font-medium">{authorName || "-"}</div>
          </div>
          {note.date && (
            <div>
              <div className="text-xs opacity-60">Last Edit</div>
              <div className="font-medium">
                {new Date(note.date).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-base-100 rounded-xl p-6 shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm mb-4">
              Are you sure you want to delete this note?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="btn btn-sm"
                onClick={() => setShowConfirm(false)}
              >
                No
              </button>
              <button className="btn btn-sm btn-error" onClick={handleDelete}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
