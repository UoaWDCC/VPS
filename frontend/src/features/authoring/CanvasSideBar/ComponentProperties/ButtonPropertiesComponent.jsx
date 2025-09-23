import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@material-ui/core";
import { useContext } from "react";
import SceneContext from "context/SceneContext";
import CustomInputLabelStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomInputLabelStyles";

import styles from "../CanvasSideBar.module.scss";
import StateOperationMenu from "../../../../components/StateVariables/StateOperationMenu";
import { modifyComponentProp } from "../../scene/operations/component";

const CustomInputLabel = CustomInputLabelStyles()(InputLabel);

/**
 * This component displays the properties in the sidebar for a button scene component.
 * @component
 */
export default function ButtonPropertiesComponent({ component }) {
  const { scenes, updateComponentProperty } = useContext(SceneContext);

  function saveLink(e) {
    modifyComponentProp(component.id, "nextScene", e.target.value)
  }

  return (
    <>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Linked Scene</CustomInputLabel>
        <Select
          className={styles.selectInput}
          value={component.nextScene}
          onChange={saveLink}
          displayEmpty
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {scenes.map((scene) => (
            <MenuItem key={scene._id} value={scene._id}>
              {scene.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <StateOperationMenu component={component} />
    </>
  );
}
