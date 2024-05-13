import { Link } from "react-router-dom";

const BackButton = () => {
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "5px",
    backgroundColor: "#0d37de",
    color: "#fff",
    textDecoration: "none",
  };

  return (
    <div style={containerStyle}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <button type="button" style={buttonStyle}>
          Go back
        </button>
      </Link>
    </div>
  );
};

export default BackButton;
