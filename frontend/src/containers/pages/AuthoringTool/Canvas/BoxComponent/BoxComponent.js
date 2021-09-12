import { Box } from "@material-ui/core";
import React from "react";

export default function BoxComponent({ id, selectElement }) {
  return (
    <Box
      sx={{
        backgroundColor: "#008a7b",
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
      }}
      width={100}
      height={100}
      key={id}
      id={id}
      onClick={selectElement}
    >
      Hello World
    </Box>
  );
}
