import { IconButton, Tooltip } from "@material-ui/core";
import ReplayIcon from "@mui/icons-material/Replay";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";

/**
 * Tooltips used when editing state variables or state operations
 *
 * @component
 */
const EditingTooltips = ({ onReset, onSave, onDelete, showOnlyDelete = false }) => {
  return (
    <>
      {!showOnlyDelete && (
        <>
          <Tooltip title="Reset">
            <IconButton color="default" onClick={onReset}>
              <ReplayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save">
            <IconButton color="primary" onClick={onSave}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
        </>
      )}
      <Tooltip title="Delete">
        <IconButton color="secondary" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default EditingTooltips;
