import { Button } from "@mui/material";
import { useContext, useState } from "react";
import { useLocation } from "react-router-dom";
import BacktoScenarioSelectionButton from "../../components/BacktoScenarioSelectionButton";
import NotesDisplayCard from "../../components/NotesDisplayCard";
import AuthenticationContext from "../../context/AuthenticationContext";

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
      <h1 style={textMargin}>
        Someone else is playing through this section of the scenario!
      </h1>
      <p style={textMargin}>Please wait for your role: {currentUserRole}</p>
      <p style={textMargin}>
        Wait for your group member(s) to finish playing through their part of
        the scenario. Then, when it’s your turn to play through (your group
        members should let you know), click the below button:
      </p>

      <Button onClick={handleOpen} variant="outlined">
        View Notes
      </Button>
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
      <BacktoScenarioSelectionButton />
      <p style={textMargin}>
        If you have just finished playing your part of the scenario, let your
        group member with the {rolesWithAccess.join(", ")} role know it is their
        turn
      </p>
      {noteOpen && (
        <NotesDisplayCard group={group} user={user} handleClose={handleClose} />
      )}
    </div>
  );
}

export default InvalidRolePage;
