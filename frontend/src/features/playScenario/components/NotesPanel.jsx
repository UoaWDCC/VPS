import React, { useContext, useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import toast from "react-hot-toast";
import { XIcon } from "lucide-react";
import AuthenticationContext from "context/AuthenticationContext";
import NotesList from "./NotesList";
import NoteDetail from "./NoteDetail";

export default function NotesPanel({ group, open, onClose }) {
  const { user } = useContext(AuthenticationContext);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [creating, setCreating] = useState(false);

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

  async function getToken() {
    return getAuth().currentUser.getIdToken();
  }

  async function fetchNotes() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const { data } = await axios.get(`/api/note/retrieveAll/${group._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetched = data || [];
      setNotes(fetched);
      if (selectedNoteId) {
        setSelectedNote(fetched.find((n) => n._id === selectedNoteId) || null);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Failed to load notes";
      setError(msg);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && group?._id) fetchNotes();
  }, [open, group?._id]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title?.toLowerCase().includes(q) || n.text?.toLowerCase().includes(q)
    );
  }, [notes, search]);

  function handleSelectNote(note) {
    setSelectedNoteId(note._id);
    setSelectedNote(note);
  }

  async function handleCreate() {
    if (!userRole || creating) return;
    setCreating(true);
    try {
      const token = await getToken();
      const prevIds = new Set(notes.map((n) => n._id));
      await axios.post(
        "/api/note/",
        { groupId: group._id, title: "New Note", email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { data } = await axios.get(`/api/note/retrieveAll/${group._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      const fetched = data || [];
      setNotes(fetched);

      const newNote = fetched.find((n) => !prevIds.has(n._id));
      if (newNote) {
        setSelectedNoteId(newNote._id);
        setSelectedNote(newNote);
      }
    } catch {
      toast.error("Failed to create note");
    } finally {
      setCreating(false);
    }
  }

  function handleSaved(updated) {
    setNotes((prev) =>
      prev.map((n) => (n._id === updated._id ? { ...n, ...updated } : n))
    );
    setSelectedNote((prev) => ({ ...prev, ...updated }));
  }

  function handleDeleted(noteId) {
    setNotes((prev) => prev.filter((n) => n._id !== noteId));
    setSelectedNoteId(null);
    setSelectedNote(null);
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/90 transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

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
              {loading ? (
                <SkeletonBody />
              ) : error ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-error text-sm">{error}</p>
                  <button className="btn btn-sm" onClick={fetchNotes}>
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
                        onSelectNote={handleSelectNote}
                        roleToName={roleToName}
                      />
                    )}
                  </div>
                  <div className="col-span-2 overflow-auto rounded-lg">
                    <NoteDetail
                      note={selectedNote}
                      group={group}
                      userRole={userRole}
                      onSaved={handleSaved}
                      onDeleted={handleDeleted}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {userRole && (
            <button
              className="fixed bottom-8 right-8 btn btn-circle btn-lg shadow-xl z-[51]"
              onClick={handleCreate}
              disabled={creating}
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
