import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const Toast = ({
  open,
  setOpen,
  severity = "success",
  message,
  autoHideDuration = 3000,
}) => {
  const onClose = (_, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
