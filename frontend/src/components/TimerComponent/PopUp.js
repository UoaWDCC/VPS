import * as React from "react";

const style = {
  position: "absolute",
  bottom: "-2%",
  right: "0%",
  width: "20%",
  backgroundColor: "red",
  border: "2px solid #000",
  padding: "40px",
};

function PopUp({ seconds }) {
  return (
    <>
      {seconds > 15 && <p style={style}>You have less than 30 seconds left!</p>}

      {seconds < 16 && <p style={style}>You have less than 15 seconds left!</p>}
    </>
  );
}

export default PopUp;
