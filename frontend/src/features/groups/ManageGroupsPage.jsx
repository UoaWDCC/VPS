import { Button } from "@material-ui/core";
import { Alert, Snackbar } from "@mui/material";
import axios from "axios";
import ScreenContainer from "components/ScreenContainer/ScreenContainer";
import { useGet } from "hooks/crudHooks";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import GroupsTable from "./GroupTable";
import TopBar from "./TopBar";

/**
 * Page that shows the groups that the admin can manipulate
 *
 * @container
 */
export default function ManageGroupsPage() {
  const { scenarioId } = useParams();
  const [scenarioGroupInfo, setScenarioGroupInfo] = useState([]);

  const [isToastShowing, setIsToastShowing] = useState(false);
  const [toastText, setToastText] = useState("");
  const [toastType, setToastType] = useState("");

  let users = [];

  // fetch groups assigned to this scenario
  const { reFetch } = useGet(
    `/api/group/scenario/${scenarioId}`,
    setScenarioGroupInfo
  );
  console.log(scenarioGroupInfo);
  if (scenarioGroupInfo.length) {
    // Iterate groups and flatten to user list
    scenarioGroupInfo.forEach((group) => {
      if (group) {
        users.push(...group.users);
      }
    });
  } else {
    users = [];
  }

  const showToast = (text, type = "success") => {
    setToastText(text);
    setToastType(type);
    setIsToastShowing(true);
  };

  // File input is a hidden input element that is activated via a click handler
  // This allows us to have an UI button that acts like a file <input> element.
  const fileInputRef = useRef(null);
  const upload = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (event) => {
    // TODO: add csv file upload handling here!
    console.log("File uploaded:", event.target.files[0]);
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log(results);
        console.log("CSV data uploaded to MongoDB.");
        const { data } = results;

        // Group data by 'group' field
        const groupMap = {};
        data.forEach((user) => {
          const { group } = user;
          if (group) {
            if (!groupMap[group]) {
              groupMap[group] = [];
            }
            groupMap[group].push({
              email: user.email,
              name: user.name,
              role: user.role,
              group: user.group,
            });
          }
        });

        const groupList = Object.values(groupMap);

        // Extract role list
        const roleList = [
          ...new Set(data.map((user) => user.role.toLowerCase())),
        ].filter((str) => str.trim() !== "");

        const jsonData = {
          groupList,
          roleList,
        };

        console.log("Processed JSON Data:", jsonData);

        // Send the parsed JSON data to the backend
        try {
          const response = await axios.post(
            `/api/group/${scenarioId}`,
            jsonData
          );

          reFetch();
          console.log("CSV data uploaded to MongoDB:", response.status);
          showToast("Successfully formed groups!");
        } catch (error) {
          console.error("Error uploading CSV data:", error);
          showToast("Error uploading CSV data!", "error");
        }
      },
    });
  };

  const convertToCSV = (data) => {
    const headers = "email,name,role,group number,playable link\n";
    let csv = headers;

    data.forEach((row) => {
      let email = "";
      let name = "";
      let role = "";
      let group = "";
      const playableLink = `https://vps-dev.wdcc.co.nz/play/${scenarioId}`;

      const entries = Object.entries(row);

      entries.forEach(([key, value]) => {
        if (key === "email") {
          email = value;
        } else if (key === "name") {
          name = value;
        } else if (key === "role") {
          role = value;
        } else if (key === "group") {
          group = value;
        }
      });

      csv += `${email},${name},${role},${group},${playableLink}\n`;
    });

    return csv;
  };

  const download = () => {
    const csv = convertToCSV(users);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "groups_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Toast close handler
  const handleToastDismiss = (_, reason) => {
    if (reason === "clickaway") {
      return;
    }
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
        <Button
          className="btn top contained white"
          color="default"
          variant="contained"
          onClick={upload}
        >
          Upload
        </Button>
        <Button
          className="btn top contained white"
          color="default"
          variant="contained"
          onClick={download}
        >
          Download
        </Button>
      </TopBar>

      <GroupsTable data={users} />
      <Snackbar
        open={isToastShowing}
        autoHideDuration={3000}
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
