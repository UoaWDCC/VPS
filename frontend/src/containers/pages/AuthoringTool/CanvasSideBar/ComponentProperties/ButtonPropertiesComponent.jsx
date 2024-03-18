import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@material-ui/core";
import { useContext } from "react";
import SceneContext from "../../../../../context/SceneContext";
import CustomInputLabelStyles from "../CustomPropertyInputStyles/CustomInputLabelStyles";
import CustomTextFieldStyles from "../CustomPropertyInputStyles/CustomTextFieldStyles";

import styles from "../../../../../styling/CanvasSideBar.module.scss";

const CustomTextField = CustomTextFieldStyles()(TextField);
const CustomInputLabel = CustomInputLabelStyles()(InputLabel);

/**
 * This component displays the properties in the sidebar for a button scene component.
 * @component
 */
export default function ButtonPropertiesComponent({
  component,
  componentIndex,
}) {
  const { scenes, updateComponentProperty } = useContext(SceneContext);

  return (
    <>
      <CustomTextField
        label="Text"
        value={component.text}
        fullWidth
        onChange={(event) =>
          updateComponentProperty(componentIndex, "text", event.target.value)
        }
        className={styles.componentProperty}
      />
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Variant</CustomInputLabel>
        <Select
          className={styles.selectInput}
          value={component.variant}
          onChange={(event) =>
            updateComponentProperty(
              componentIndex,
              "variant",
              event.target.value
            )
          }
        >
          <MenuItem value="contained">Contained</MenuItem>
          <MenuItem value="outlined">Outlined</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Colour</CustomInputLabel>
        <Select
          className={styles.selectInput}
          value={component.colour}
          onChange={(event) =>
            updateComponentProperty(
              componentIndex,
              "colour",
              event.target.value
            )
          }
        >
          <MenuItem value="white">White</MenuItem>
          <MenuItem value="teal">Teal</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Next Scene</CustomInputLabel>
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
    </>
  );
}
