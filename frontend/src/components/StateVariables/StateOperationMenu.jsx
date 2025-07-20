import { Typography } from "@material-ui/core";
import { useState } from "react";
import CreateStateOperation from "./CreateStateOperation";

const StateOperationMenu = () => {
  const [stateOperations, setStateOperations] = useState([]);

  return (
    <div>
      <Typography variant="subtitle1" style={{ marginTop: "30px", marginBottom: "20px" }}>
        State Variables
      </Typography>
      <CreateStateOperation />
    </div>
  );
};

export default StateOperationMenu;
