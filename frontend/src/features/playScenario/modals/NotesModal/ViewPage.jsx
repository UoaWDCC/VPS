import { useAuthGet, useAuthPost } from "hooks/crudHooks";
import { useEffect, useState } from "react";

import { Add } from "@material-ui/icons";
import NoteCard from "./NoteCard.jsx";
import CloseIcon from "@mui/icons-material/Close";

export default function ViewPage({
  group,
  user,
  role,
  setContent,
  handleClose,
}) {
  const [notes, setNotes] = useState([]);

  const {
    response: groupData,
    loading: groupLoading,
    error: groupError,
    getRequest: retrieveNotes,
  } = useAuthGet(`/api/note/retrieveAll/${group._id}`, setNotes);

  const {
    response: createResponse,
    loading: noteCreating,
    error: createError,
    postRequest: createNoteRequest,
  } = useAuthPost("/api/note/");

  useEffect(() => {
    retrieveNotes();
  }, []);

  const handleCreate = async () => {
    if (!role) return;

    await createNoteRequest({
      groupId: group._id,
      title: "New Note",
      email: user.email,
    });

    retrieveNotes();
  };

  return (
    <>
      <div className="flex w-full justify-between">
        <h2 className="text-2xl font-semibold">Notes</h2>
        <button type="button" onClick={handleClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="flex flex-wrap gap-10 h-fit">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            {...note}
            onClick={() => setContent(note._id)}
          />
        ))}
        <div
          className="card bg-slate-50 w-60 h-40 shadow-xl cursor-pointer hover:border-2 border-slate-300"
          onClick={handleCreate}
        >
          <div className="card-body flex justify-center items-center text-slate-500">
            <Add fontSize="large" />
          </div>
        </div>
      </div>
    </>
  );
}
