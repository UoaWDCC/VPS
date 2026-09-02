import React, { useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { XIcon } from "lucide-react";
import AuthenticationContext from "context/AuthenticationContext";
import NotesList from "./NotesList";
import NoteDetail from "./NoteDetail";
import PanelOverlay from "../../../components/PanelOverlay";
import { createNote, getNotes, notesQueryKey } from "./notesApi";

const EMPTY_NOTES = [];

export default function NotesPanel({ group, open, onClose }) {
  const { user } = useContext(AuthenticationContext);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const userRole = useMemo(() => {
    if (!group?.users || !user?.email) return null;
    return group.users.find((u) => u.email === user.email)?.role ?? null;
  }, [group, user]);

  const roleToName = useMemo(() => {
    const map = {};
    group?.users?.forEach((u) => {
      map[u.role] = u.name;
    });
    return map;
  }, [group]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const notesQuery = useQuery({
    queryKey: notesQueryKey(group?._id),
    queryFn: () => getNotes(user, group._id),
    enabled: Boolean(open && group?._id && user),
  });

  const notes = notesQuery.data ?? EMPTY_NOTES;
  const selectedNote = notes.find((n) => n._id === selectedNoteId) ?? null;

  useEffect(() => {
    if (notesQuery.error) toast.error("Failed to load notes");
  }, [notesQuery.error]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title?.toLowerCase().includes(q) || n.text?.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const prevIds = new Set(notes.map((n) => n._id));
      await createNote(user, group._id, "New Note");
      // The create endpoint returns no body, so refetch and pick out whichever
      // note is new in order to select it.
      const fetched = await getNotes(user, group._id);
      queryClient.setQueryData(notesQueryKey(group._id), fetched);
      return fetched.find((n) => !prevIds.has(n._id));
    },
    onSuccess: (newNote) => {
      if (newNote) setSelectedNoteId(newNote._id);
    },
    onError: () => toast.error("Failed to create note"),
  });

  return (
    <>
      <PanelOverlay open={open} onClose={onClose} />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Notes"
        onClick={onClose}
      >
        <div
          className="shadow-2xl w-full h-full overflow-hidden font-ibm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="u-container w-full pt-4xl">
            <div className="flex justify-between items-center mb-l">
              <h1 className="text-xl">Notes</h1>
              <button
                className="btn btn-phantom btn-sm"
                onClick={onClose}
                aria-label="Close"
              >
                <XIcon size={32} />
              </button>
            </div>

            <div className="p-3">
              <input
                type="text"
                className="w-full outline-none pb-3 border-0 border-b-1 border-primary"
                placeholder="Search notes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="p-3 h-[calc(100%-112px)] overflow-hidden">
              {notesQuery.isPending ? (
                <SkeletonBody />
              ) : notesQuery.error ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-error text-sm">
                    {notesQuery.error?.response?.data?.error ||
                      notesQuery.error.message ||
                      "Failed to load notes"}
                  </p>
                  <button
                    className="btn btn-sm"
                    onClick={() => notesQuery.refetch()}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
                  <div className="overflow-y-auto rounded-lg p-1 max-h-[65vh]">
                    {filteredNotes.length === 0 ? (
                      <p className="opacity-70 text-sm text-center px-4">
                        {notes.length > 0
                          ? "No notes found."
                          : "You don't have any notes. Press + to create one."}
                      </p>
                    ) : (
                      <NotesList
                        notes={filteredNotes}
                        selectedNoteId={selectedNoteId}
                        onSelectNote={(note) => setSelectedNoteId(note._id)}
                        roleToName={roleToName}
                      />
                    )}
                  </div>
                  <div className="col-span-2 overflow-auto rounded-lg">
                    <NoteDetail
                      note={selectedNote}
                      group={group}
                      userRole={userRole}
                      onDeleted={() => setSelectedNoteId(null)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {userRole && (
            <button
              className="fixed bottom-8 right-8 btn btn-circle btn-lg shadow-xl z-[51]"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              aria-label="New note"
              title="New note"
            >
              <span className="text-2xl leading-none">+</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function SkeletonBody() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg space-y-1">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        ))}
      </div>
      <div className="col-span-2 space-y-2">
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-4 w-1/4" />
      </div>
    </div>
  );
}
