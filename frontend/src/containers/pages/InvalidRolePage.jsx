import React from "react";
import BackButton from "../../components/BackButton";

function InvalidRolePage() {
  const currentUserRole = "Doctor";
  const rolesWithAccess = ["Nurse", "Patient"];

  const containerStyle = {
    fontFamily: "Sitka Text, sans-serif",
    fontWeight: "600",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    textAlign: "center",
  };

  const textMargin = {
    margin: "40px 0",
  };

  return (
    <div style={containerStyle}>
      <h1 style={textMargin}>
        Someone else is playing through this section of the scenario!
      </h1>
      <p style={textMargin}>Please wait for your role: {currentUserRole}</p>
      <BackButton />
      <p style={textMargin}>Roles with access: {rolesWithAccess.join(", ")}</p>
    </div>
  );
}

export default InvalidRolePage;
