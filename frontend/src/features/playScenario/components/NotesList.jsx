import React from "react";
import { UserIcon } from "lucide-react";

export default function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  roleToName,
}) {
  return (
    <ul className="space-y-4">
      {notes.map((note) => {
        const isSelected = selectedNoteId === note._id;
        const author = roleToName?.[note.role] ?? note.role ?? "-";
        const date = note.date ? new Date(note.date).toLocaleDateString() : "-";

        return (
          <li key={note._id}>
            <button
              className={`cursor-pointer w-full text-left p-4 border border-primary 
                transition-colors hover:bg-base-200 ${
                  isSelected ? "bg-base-200" : ""
                }`}              
              onClick={() => onSelectNote(note)}
            >
              <h3 className="font-medium text-sm truncate">
                {note.title || "Untitled"}
              </h3>
              <p className="text-xs opacity-70 mt-1 line-clamp-3 whitespace-pre-wrap">
                {note.text || "No content"}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs opacity-60">
                <span className="flex items-center gap-1">
                  <UserIcon size={12} />
                  {author}
                </span>
                <span className="opacity-80">{date}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
