const BackToScenarioSelectionButton = () => {
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "5px",
    backgroundColor: "#035084",
    textDecoration: "none",
    color: "#FFFFFF",
  };

  const handleClick = () => {
    window.location.reload();
  };

  return (
    <div style={containerStyle}>
      <button type="button" style={buttonStyle} onClick={handleClick}>
        Try Access Scenario
      </button>
    </div>
  );
};

export default BackToScenarioSelectionButton;
