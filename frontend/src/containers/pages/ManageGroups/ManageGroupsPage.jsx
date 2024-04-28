import { Button } from "@material-ui/core";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Route,
  Switch,
  useHistory,
  useParams,
  useRouteMatch,
} from "react-router-dom";
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

  function download() {
    console.log("downloading current group config as .CSV");
  }

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
