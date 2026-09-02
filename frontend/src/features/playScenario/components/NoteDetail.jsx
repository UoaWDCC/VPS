import React, { useContext, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AuthenticationContext from "context/AuthenticationContext";
import MDTextViewer from "./MDTextViewer";
import { deleteNote, notesQueryKey, updateNote } from "./notesApi";

export default function NoteDetail({ note, group, userRole, onDeleted }) {
  const { user } = useContext(AuthenticationContext);
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const canEdit = !!(userRole && note?.role === userRole);
  const authorUser = group?.users?.find((u) => u.role === note?.role);
  const authorName = authorUser?.name
    ? `${note?.role} - ${authorUser.name}`
    : (note?.role ?? "-");

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

  const invalidateNotes = () =>
    queryClient.invalidateQueries({ queryKey: notesQueryKey(group._id) });

  const saveMutation = useMutation({
    mutationFn: () => updateNote(user, group._id, note._id, { title, text }),
    onSuccess: () => {
      setEditing(false);
      return invalidateNotes();
    },
    onError: () => toast.error("Failed to save note"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(user, group._id, note._id),
    onSuccess: () => {
      onDeleted?.(note._id);
      return invalidateNotes();
    },
    onError: () => toast.error("Failed to delete note"),
    onSettled: () => setShowConfirm(false),
  });

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
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving…" : "Save"}
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
          <MDTextViewer
            file={{ type: "text/markdown", name: "note.md" }}
            content={note.text || ""}
          />
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
          className="fixed inset-0 z-[60] bg-backdrop/60 flex items-center justify-center"
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
              <button
                className="btn btn-sm btn-error"
                onClick={() => deleteMutation.mutate()}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
