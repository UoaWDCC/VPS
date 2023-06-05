import * as React from "react";
import Box from "@material-ui/core/Box";

const style = {
  position: "absolute",
  bottom: "0%",
  right: "0%",
  width: "20%",
  bgcolor: "red",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

function PopUp({ seconds }) {
  return (
    <div>
      {seconds > 15 && (
        <Box sx={style}>
          <p>You have less than 30 seconds left!</p>
        </Box>
      )}

      {seconds <= 15 && (
        <Box sx={style}>
          <p>You have less than 15 seconds left!</p>
        </Box>
      )}
    </div>
  );
}

export default PopUp;
