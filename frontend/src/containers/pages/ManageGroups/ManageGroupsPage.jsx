import { Button } from "@material-ui/core";
import { useRef } from "react";
import { useParams } from "react-router-dom";
import ScreenContainer from "components/ScreenContainer";
import TopBar from "./TopBar";
import GroupsTable from "./GroupTable";

/**
 * Page that shows the groups that the admin can manipulate
 *
 * @container
 */

export default function ManageGroupsPage() {
  const { scenarioId } = useParams();
  const tableData = [
    {
      groupNumber: 1,
      nurse: "Alice Cheng",
      doctor: "Johnathon Stone",
      pharmacist: "Charlie Puth",
    },
    {
      groupNumber: 2,
      nurse: "Alice Cheng",
      doctor: "Bob Marley",
      pharmacist: "Charlie Puth",
    },
    {
      groupNumber: 3,
      nurse: "Alice Cheng",
      doctor: "Tony Stark",
      pharmacist: "Victoria Secret",
    },
    {
      groupNumber: 4,
      nurse: "Mister Run Fast",
      doctor: "Tester no24",
      pharmacist: "Radioactive Waste",
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
    const headers = "email,first name,last name,playable link\n";
    let csv = headers;
  
    tableData.forEach((row) => {
      const { nurse, doctor, pharmacist, groupNumber } = row;
      const emails = [nurse, doctor, pharmacist]
        .filter(Boolean) // Filter out falsy values (e.g., undefined, null)
        .map((role) => `${role.replace(/\s/g, '')}@example.com`);
      const names = [nurse, doctor, pharmacist]
        .filter(Boolean)
        .map((role) => {
          const split_name = role.split(' ');
          const firstName = split_name[0];
          const lastName = split_name[split_name.length - 1];
          return `${firstName},${lastName}`;
        });
      const playableLinks = [nurse, doctor, pharmacist]
        .filter(Boolean)
        .map(() => `https://vps-dev.wdcc.co.nz/play/${scenarioId}/${row.groupNumber}`);
  
      emails.forEach((email, index) => {
        csv += `${email},${names[index]},${playableLinks[index]}\n`;
      });
    });
  
    return csv;
  };

  const download = (csv) => {
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
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
