import { Button } from "@mui/material";
import { useContext, useState } from "react";
import { useLocation } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import NotesDisplayCard from "../playScenario/modals/NotesModal/NotesModal";

function InvalidRolePage({ group }) {
  const { user } = useContext(AuthenticationContext);
  const location = useLocation();

  const [noteOpen, setNoteOpen] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const rolesWithAccess = JSON.parse(queryParams.get("roles") || `["Stalin"]`);
  const currentUserRole = group.users.find((u) => u.email === user.email).role;

  const handleClose = () => setNoteOpen(false);
  const handleOpen = () => setNoteOpen(true);

  const containerStyle = {
    fontWeight: "600",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    textAlign: "center",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "0 20px",
  };

  const textMargin = {
    margin: "50px 0",
  };

  return (
    <div style={containerStyle}>
      <h1 style={textMargin} className="font-semibold text-4xl text-uoa-blue">
        It's your group members turn to play through the scenario!
      </h1>
      <p style={textMargin} className="font-semibold text-xl">
        If you have just finished playing your part of the scenario, <br />
        <span className="underline">
          let your group member with the {rolesWithAccess.join(", ")} role know
          it is their turn
        </span>
      </p>
      <p style={textMargin} className="text-slate-600">
        Wait for your group member(s) to finish playing through their part of
        the scenario. Then, when it's your turn to play through (your group
        members should let you know), click the below button:
      </p>

      <div className="flex justify-around w-[60%]">
        <button
          type="button"
          className="btn btn-general"
          onClick={handleOpen}
          style={{ width: "210px" }}
        >
          View Notes
        </button>
        <p
          style={{
            marginBottom: "1em",
            marginTop: "1em",
            fontWeight: 400,
            color: "#5c6573",
          }}
        >
          — or —
        </p>
        <button
          className="btn btn-neutral"
          type="button"
          onClick={() => window.location.reload()}
          style={{ width: "210px" }}
        >
          Try Access Scenario
        </button>
      </div>
      <p className="font-mono text-xs mt-20">
        Current user role: {currentUserRole}
        <br />
        Allowed roles: {rolesWithAccess.join(", ")}
      </p>
      {noteOpen && (
        <NotesDisplayCard group={group} user={user} handleClose={handleClose} />
      )}
    </div>
  );
}

export default InvalidRolePage;
