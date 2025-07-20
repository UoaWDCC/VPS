import { Typography } from "@material-ui/core";
import { useState } from "react";
import CreateStateOperation from "./CreateStateOperation";
import EditStateOperation from "./EditStateOperation"

const StateOperationMenu = () => {
  const [stateOperations, setStateOperations] = useState([]);

  return (
    <div>
      <Typography
        variant="subtitle1"
        style={{ marginTop: "30px", marginBottom: "20px" }}
      >
        State Variables
      </Typography>
      <CreateStateOperation
        stateOperations={stateOperations}
        setStateOperations={setStateOperations}
      />
      {stateOperations.map((stateOperation) => (
        <EditStateOperation stateOperation={stateOperation} key={stateOperation} />
      ))}
    </div>
  );
};

export default StateOperationMenu;
