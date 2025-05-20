import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Typography,
} from "@material-ui/core";
import { useContext } from "react";
import SceneContext from "context/SceneContext";
import CustomInputLabelStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomInputLabelStyles";
import {
  handleSendToBack,
  handleBringToFront,
  handleMoveBackward,
  handleMoveForward,
} from "./utils/zAxisUtils";

import styles from "../CanvasSideBar.module.scss";

const CustomInputLabel = CustomInputLabelStyles()(InputLabel);

/**
 * This component displays the properties in the sidebar for a button scene component.
 * @component
 */
export default function ImagePropertiesComponent({
  component,
  componentIndex,
}) {
  const { scenes, updateComponentProperty, currentScene } =
    useContext(SceneContext);

  return (
    <>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Linked Scene</CustomInputLabel>
        <Select
          className={styles.selectInput}
          value={component.nextScene}
          onChange={(event) =>
            updateComponentProperty(
              componentIndex,
              "nextScene",
              event.target.value
            )
          }
          displayEmpty
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {scenes.map((scene) => {
            return (
              <MenuItem key={scene._id} value={scene._id}>
                {scene.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Z Axis Position</CustomInputLabel>
        <Typography
          variant="body2"
          style={{
            marginTop: "0.5em",
            marginBottom: "0.5em",
            textAlign: "center",
          }}
        >
          Current Z: {component?.zPosition ?? 0}
        </Typography>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5em",
            marginTop: "0.5em",
            width: "100%",
          }}
        >
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              handleMoveBackward({
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
          >
            Move Backward
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              handleMoveForward({
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
          >
            Move Forward
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              handleSendToBack({
                currentScene,
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
            fullWidth
          >
            Send to Back
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              handleBringToFront({
                currentScene,
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
            fullWidth
          >
            Bring to Front
          </Button>
        </div>
      </FormControl>
    </>
  );
}
