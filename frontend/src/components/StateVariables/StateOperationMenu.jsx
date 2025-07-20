import { Typography } from "@material-ui/core";
import CreateStateOperation from "./CreateStateOperation";
import EditStateOperation from "./EditStateOperation";

const StateOperationMenu = ({ component, componentIndex }) => {
  return (
    <div>
      <Typography
        variant="subtitle1"
        style={{ marginTop: "30px", marginBottom: "20px" }}
      >
        State Variables
      </Typography>
      <CreateStateOperation
        component={component}
        componentIndex={componentIndex}
      />
      {component.stateOperations &&
        component.stateOperations.map((stateOperation, operationIndex) => (
          <EditStateOperation
            componentIndex={componentIndex}
            component={component}
            operationIndex={operationIndex}
            stateOperation={stateOperation}
            key={operationIndex}
          />
        ))}
    </div>
  );
};

export default StateOperationMenu;
