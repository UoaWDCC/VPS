import { Alert, Snackbar } from "@mui/material";
import axios from "axios";
import Papa from "papaparse";
import { useContext, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import TopBar from "../../components/TopBar/TopBar";
import AuthenticationContext from "../../context/AuthenticationContext";

export default function ManageResourcesPage() {
  const { VpsUser } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();

  const fileInputRef = useRef(null);

  const [isToastShowing, setIsToastShowing] = useState(false);
  const [toastText, setToastText] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (text, type = "success") => {
    setToastText(text);
    setToastType(type);
    setIsToastShowing(true);
  };

  const upload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data } = results;

        try {
          const response = await axios.post(
            `/api/resource/${scenarioId}`,
            data 
          );

          showToast("Successfully uploaded resources!");
        } catch (error) {
          const msg = error?.response?.data || "Unknown error";
          showToast(`Error uploading: ${msg}`, "error");
        }
      },
    });
  };

  const handleToastDismiss = (_, reason) => {
    if (reason === "clickaway") return;
    setIsToastShowing(false);
  };

  return (
    <ScreenContainer vertical>
      <TopBar back={`/scenario/${scenarioId}`}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <button className="btn vps w-[100px]" onClick={upload}>
          Upload
        </button>
      </TopBar>

      {/* TODO: Add content here */}

      <Snackbar
        open={isToastShowing}
        autoHideDuration={5000}
        onClose={handleToastDismiss}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleToastDismiss}
          severity={toastType}
          sx={{ width: "100%" }}
        >
          {toastText}
        </Alert>
      </Snackbar>
    </ScreenContainer>
  );
}
