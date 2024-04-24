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

/**
 * Page that shows the groups that the admin can manipulate
 *
 * @container
 */

export default function ManageGroupsPage() {
  const { scenarioId } = useParams();

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
      <TopBar back = {`/scenario/${scenarioId}`}>
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

      {/* On top of the action button available in the top menu bar, we also override user's rightclick context menu to offer the same functionality. */}
      {/* <div onContextMenu={handleContextMenu}>
      </div> */}
    </ScreenContainer>
  );
}
