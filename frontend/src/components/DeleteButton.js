import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import { red } from "@material-ui/core/colors";

const DeleteButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[600]),
    backgroundColor: red[600],
    "&:hover": {
      backgroundColor: red[700],
    },
    "&.Mui-disabled": {
      color: theme.palette.getContrastText(red[600]),
      opacity: 0.3,
      backgroundColor: red[600],
    },
  },
}))(Button);

export default DeleteButton;
