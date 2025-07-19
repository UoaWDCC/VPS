import { Button, Typography } from "@material-ui/core";
import { useState } from "react";
import StateOperationForm from "./StateOperationForm";

const StateOperationMenu = () => {
  const [stateOperations, setStateOperations] = useState([]);

  const addOperation = () => {
    setStateOperations([...stateOperations, {}]);
  };

  return (
    <div>
      <Typography variant="subtitle1" style={{ marginTop: "30px" }}>
        State Variables
      </Typography>
      <Button onClick={addOperation}>New Operation</Button>
      <div style={{ marginTop: "16px" }}>
        {stateOperations.map((stateOperator, index) => (
          <StateOperationForm key={index} stateOperator={stateOperator} />
        ))}
      </div>
    </div>
  );
};

export default StateOperationMenu;
