import { Button } from "@material-ui/core";
import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ScreenContainer from "components/ScreenContainer";
import { useGet } from "hooks/crudHooks";
import TopBar from "./TopBar";
import GroupsTable from "./GroupTable";

/**
 * Page that shows the groups that the admin can manipulate
 *
 * @container
 */

export default function ManageGroupsPage() {
  const { scenarioId } = useParams();
  const [scenarioGroupInfo, setScenarioGroupInfo] = useState([]);
  let groups;

  // fetch groups assigned to this scenario
  const fetchGroups = () => {
    useGet(`/api/group/scenario/${scenarioId}`, setScenarioGroupInfo);
    if (scenarioGroupInfo[0]) {
      groups = scenarioGroupInfo[0].users;
    } else {
      groups = [];
    }
  };

  fetchGroups();

  const tableData = [
    {
      groupNumber: 1,
      nurse: "Alice Cheng",
      doctor: "Bob Marley",
      pharmacist: "Charlie Puth",
      progress: "50%",
    },
    {
      groupNumber: 2,
      nurse: "Alice Cheng",
      doctor: "Bob Marley",
      pharmacist: "Charlie Puth",
      progress: "20%",
    },
    {
      groupNumber: 3,
      nurse: "Alice Cheng",
      doctor: "Bob Marley",
      pharmacist: "Charlie Puth",
      progress: "0%",
    },
    {
      groupNumber: 4,
      nurse: "Alice Cheng",
      doctor: "Bob Marley",
      pharmacist: "Charlie Puth",
      progress: "300%",
    },
  ];

  // File input is a hidden input element that is activated via a click handler
  // This allows us to have an UI button that acts like a file <input> element.
  const fileInputRef = useRef(null);
  const upload = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (event) => {
    // TODO: add csv file upload handling here!
    console.log("File uploaded:", event.target.files[0]);
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
    const csv = convertToCSV(groups);
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

      <GroupsTable data={tableData} />
    </ScreenContainer>
  );
}
