import { Link } from "react-router-dom";

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

  return (
    <div style={containerStyle}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <button type="button" style={buttonStyle}>
          Back to Scenarios
        </button>
      </Link>
    </div>
  );
};

export default BackToScenarioSelectionButton;
