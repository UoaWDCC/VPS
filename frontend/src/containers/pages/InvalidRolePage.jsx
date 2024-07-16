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
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    textAlign: "center",
  };

  const textMargin = {
    margin: "50px 0",
  };

  const bottomTextContainerStyle = {
    marginTop: "auto",
    marginBottom: "30px",
  };

  return (
    <div style={containerStyle}>
      <h1 style={textMargin}>
        Someone else is playing through this section of the scenario!
      </h1>
      <p style={textMargin}>Please wait for your role: {currentUserRole}</p>
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
      <div style={bottomTextContainerStyle}>
        <p>Roles with access to this scene: {rolesWithAccess.join(", ")}</p>
      </div>
      {noteOpen && (
        <NotesDisplayCard group={group} user={user} handleClose={handleClose} />
      )}
    </div>
  );
}

export default InvalidRolePage;
