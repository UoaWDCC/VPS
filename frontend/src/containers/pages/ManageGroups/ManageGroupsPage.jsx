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

  // fetch groups assigned to this scenario
  useGet(`/api/group/scenario/${scenarioId}`, setScenarioGroupInfo);
  let groups;
  if (scenarioGroupInfo[0].users) {
    groups = scenarioGroupInfo[0].users;
  } else {
    console.log("no user data");
    groups = [];
  }

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

  const convertToCSV = (tableData) => {
    const headers = "email,first name,last name,group number,playable link\n";
    let csv = headers;

    tableData.forEach((row) => {
      for (const prop in row) {
        if (typeof row[prop] == 'string') {
          const email = `${row[prop].replace(/\s/g, '')}@aucklanduni.ac.nz`;
          const split_name = row[prop].split(' ')
          const firstName = split_name[0];
          const lastName = split_name[split_name.length - 1];
          const playableLink = `https://vps-dev.wdcc.co.nz/play/${scenarioId}/${row.groupNumber}`;
          csv += `${email},${firstName},${lastName},${playableLink}\n`;
        }
      }
    });
    return csv;
  };

  const download = () => {
    const csv = convertToCSV(groups);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groups_data.csv';
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
