import { Button } from "@material-ui/core";
import React from "react";

export default function TestButtonComponent({ id, selectElement }) {
  return (
    <Button
      className="btn top contained white"
      style={{ position: "absolute" }}
      color="default"
      variant="contained"
      id={id}
      onClick={selectElement}
    >
      TEST COMPONENT
    </Button>
  );
}
