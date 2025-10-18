import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@material-ui/core";
import { useContext } from "react";
import SceneContext from "context/SceneContext";
import CustomInputLabelStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomInputLabelStyles";
import CustomTextFieldStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomTextFieldStyles";

import styles from "../CanvasSideBar.module.scss";

const CustomTextField = CustomTextFieldStyles()(TextField);
const CustomInputLabel = CustomInputLabelStyles()(InputLabel);

/**
 * This component displays the properties in the sidebar for a button scene component.
 * @component
 */
export default function ImagePropertiesComponent({
  component,
  componentIndex,
}) {
  const { scenes, updateComponentProperty } = useContext(SceneContext);

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
        <CustomTextField
          label="Z Axis Position"
          type="number"
          value={component?.zPosition || ""}
          fullWidth
          onChange={(event) =>
            updateComponentProperty(
              componentIndex,
              "zPosition",
              event.target.value
            )
          }
          InputLabelProps={{
            // label moves up whenever there is input
            shrink: !!component?.zPosition,
          }}
        />
      </FormControl>
    </>
  );
}
