import { React, useState } from "react";

export default function NotesDisplayCard() {
  const [name, setName] = useState("default name");
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <>
      <button type="button" onClick={handleOpen}>
        Notes
      </button>
    </>
  );
}
