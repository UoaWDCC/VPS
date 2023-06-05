import * as React from "react";

const style = {
  position: "absolute",
  bottom: "0%",
  right: "0%",
  width: "20%",
  backgroundColor: "red",
  border: "2px solid #000",
  margin: 0,
  padding: "40px",
};

function PopUp({ seconds }) {
  return (
    <p style={style}>
      {seconds > 15
        ? "You have less than 30 seconds left!"
        : "You have less than 15 seconds left!"}
    </p>
  );
}

export default PopUp;
