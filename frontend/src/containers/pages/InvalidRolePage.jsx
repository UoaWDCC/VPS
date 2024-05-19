import BacktoScenarioSelectionButton from "../../components/BacktoScenarioSelectionButton";

function InvalidRolePage() {
  const currentUserRole = "Doctor";
  const rolesWithAccess = ["Nurse", "Patient"];

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
      <BacktoScenarioSelectionButton />
      <div style={bottomTextContainerStyle}>
        <p>Roles with access to this scene: {rolesWithAccess.join(", ")}</p>
      </div>
    </div>
  );
}

export default InvalidRolePage;
