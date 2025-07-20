import { Typography } from "@material-ui/core";
import { useState } from "react";
import CreateStateOperation from "./CreateStateOperation";
import EditStateOperation from "./EditStateOperation";

const StateOperationMenu = ({ component, componentIndex }) => {
  const [stateOperations, setStateOperations] = useState(component.stateOperations || []);

  return (
    <div>
      <Typography
        variant="subtitle1"
        style={{ marginTop: "30px", marginBottom: "20px" }}
      >
        State Variables
      </Typography>
      <CreateStateOperation
        componentIndex={componentIndex}
        stateOperations={stateOperations}
        setStateOperations={setStateOperations}
      />
      {stateOperations.map((stateOperation) => (
        <EditStateOperation
          stateOperation={stateOperation}
          key={stateOperation}
        />
      ))}
    </div>
  );
};

export default StateOperationMenu;
