import { Alert, Snackbar } from "@mui/material";
import axios from "axios";
import Papa from "papaparse";
import { useContext, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import TopBar from "../../components/TopBar/TopBar";
import AuthenticationContext from "../../context/AuthenticationContext";
import { getAuth } from "firebase/auth";

export default function ManageResourcesPage() {
  const { VpsUser } = useContext(AuthenticationContext);

  if (!VpsUser) {
    return (
      <ScreenContainer vertical>
        <TopBar back="/">
          <h1 className="text-2xl">Manage Resources</h1>
        </TopBar>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg">You must be logged in to manage resources.</p>
          <p className="text-lg">Please log in to continue.</p>
        </div>
      </ScreenContainer>
    );
  }

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

        console.log("Parsed CSV data:", data);

        try {
          const auth = getAuth();
          const user = auth.currentUser;

          if (!user) {
            showToast("You must be logged in to upload.", "error");
            return;
          }

          const idToken = await user.getIdToken();

          const response = await axios.post(
            `/api/resources/${scenarioId}`,
            data,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );

          console.log("Backend response:", response.data);

          showToast(`Successfully uploaded ${data.length} resources!`);
          console.log(`Successfully uploaded ${data.length} resources!`);
        } catch (error) {
          const msg = error?.response?.data || error.message || "Unknown error";
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
