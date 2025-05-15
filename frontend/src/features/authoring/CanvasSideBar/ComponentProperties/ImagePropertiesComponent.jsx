import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Button,
  Typography,
} from "@material-ui/core";
import { useContext } from "react";
import SceneContext from "context/SceneContext";
import CustomInputLabelStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomInputLabelStyles";
import CustomTextFieldStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomTextFieldStyles";

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

  const handleSendToBack = () => {
    if (!currentScene || !currentScene.components) return;

    const zPositions = currentScene.components
      .map((c) => c.zPosition)
      .filter((z) => typeof z === "number");

    if (zPositions.length === 0 && (component?.zPosition ?? 0) === 0) {
      // This empty block was in the diff, preserving it.
    }

    const minZ = zPositions.length > 0 ? Math.min(...zPositions) : 0;

    if ((component?.zPosition ?? 0) === minZ) {
      if (zPositions.length > 0 || (component?.zPosition ?? 0) < 0) {
        return;
      }
    }
    if ((component?.zPosition ?? 0) < minZ) {
      return;
    }
    updateComponentProperty(componentIndex, "zPosition", minZ - 1);
  };

  const handleBringToFront = () => {
    if (!currentScene || !currentScene.components) return;

    const zPositions = currentScene.components
      .map((c) => c.zPosition)
      .filter((z) => typeof z === "number");

    const maxZ = zPositions.length > 0 ? Math.max(...zPositions) : 0;

    if ((component?.zPosition ?? 0) === maxZ) {
      if (zPositions.length > 0 || (component?.zPosition ?? 0) > 0) {
        return;
      }
    }
    if ((component?.zPosition ?? 0) > maxZ) {
      return;
    }
    updateComponentProperty(componentIndex, "zPosition", maxZ + 1);
  };

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
              updateComponentProperty(
                componentIndex,
                "zPosition",
                (component?.zPosition ?? 0) - 1
              )
            }
          >
            Move Backward
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              updateComponentProperty(
                componentIndex,
                "zPosition",
                (component?.zPosition ?? 0) + 1
              )
            }
          >
            Move Forward
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={handleSendToBack}
            fullWidth
          >
            Send to Back
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={handleBringToFront}
            fullWidth
          >
            Bring to Front
          </Button>
        </div>
      </FormControl>
    </>
  );
}
