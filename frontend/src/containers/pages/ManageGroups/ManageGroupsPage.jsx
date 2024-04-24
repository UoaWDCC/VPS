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
  function download() {
    console.log("downloading current group config as .CSV");
  }

  function upload() {
    console.log("csv upload pressed");
  }

  return (
    <ScreenContainer vertical>
      <TopBar back = {`/scenario/${scenarioId}`}>
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
