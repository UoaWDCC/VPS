import { Typography } from "@material-ui/core";
import CreateStateOperation from "./CreateStateOperation";
import EditStateOperation from "./EditStateOperation";

/*
 * Component that houses state operation interface (methods for creating and editing)
 *
 * @component
 */
const StateOperationMenu = ({ component }) => {
  return (
    <div>
      <Typography
        variant="subtitle1"
        style={{ marginTop: "30px", marginBottom: "20px" }}
      >
        State Operations
      </Typography>
      <CreateStateOperation component={component} />
      {component.stateOperations &&
        component.stateOperations.map((stateOperation, operationIndex) => (
          <EditStateOperation
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
