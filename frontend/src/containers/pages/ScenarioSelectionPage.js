import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import MenuItem from "@material-ui/core/MenuItem";
import ContextMenu from "../../components/ContextMenu";
import SideBar from "../../components/SideBar";
import ListContainer from "../../components/ListContainer";
import ScreenContainer from "../../components/ScreenContainer";
import ScenarioContext from "../../context/ScenarioContext";
import { usePut, useDelete } from "../../hooks/crudHooks";
import AuthenticationContext from "../../context/AuthenticationContext";
import AccessLevel from "../../enums/route.access.level";

/**
 * Page that shows the user's existing scenarios.
 *
 * @container
 */
export default function ScenarioSelectionPage({ data = null }) {
  const {
    scenarios,
    reFetch,
    assignedScenarios,
    reFetch2,
    currentScenario,
    setCurrentScenario,
  } = useContext(ScenarioContext);
  console.log(assignedScenarios);
  const { getUserIdToken, VpsUser } = useContext(AuthenticationContext);
  const history = useHistory();

  /** Handle right-click to open up ContextMenu */
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  function handleContextMenu(event) {
    event.preventDefault();
    if (contextMenuPosition == null) {
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
    } else {
      setContextMenuPosition(null);
    }
  }

  /** Calls backend end point to switch to the lecturer's dashboard */
  function openDashboard() {
    history.push("/dashboard");
  }

  /** Calls backend end point to delete a scenario. */
  async function deleteScenario() {
    await useDelete(`/api/scenario/${currentScenario._id}`, getUserIdToken);
    setCurrentScenario(null);
    reFetch();
  }

  /** Opens new window to play selected scenario. */
  function playScenario() {
    window.open(`/play/${currentScenario._id}`, "_blank");
  }

  // invalid name state stores the last item that had a null name, will display error message
  const [invalidNameId, setInvalidNameId] = useState("");

  /** function is called when the user unfocuses from a scenario name */
  async function changeScenarioName({ target }) {
    /**
     * if target value of name entered is empty, of of just spaces, instantly revert to the previous name
     */
    if (
      target.value === "" ||
      target.value === null ||
      target.value.trim() === ""
    ) {
      target.value = currentScenario.name;
      setInvalidNameId(currentScenario._id);
    } else {
      setInvalidNameId("");
    }

    await usePut(
      `/api/scenario/${currentScenario._id}`,
      {
        ...currentScenario,
        name: target.value,
      },
      getUserIdToken
    );
    reFetch();
  }

  /** function is called when the user double clicks a scenario */
  async function editScenario() {
    // should be set on the first click, but check to be sure anyway
    if (currentScenario != null) {
      history.push(`/scenario/${currentScenario._id}`);
    }
  }

  useEffect(() => {
    setCurrentScenario(null);
    reFetch();

    reFetch2();
  }, []);

  return (
    <ScreenContainer>
      <SideBar />
      <div onContextMenu={handleContextMenu}>
        <ContextMenu
          position={contextMenuPosition}
          setPosition={setContextMenuPosition}
        >
          <MenuItem onClick={playScenario} disabled={!currentScenario}>
            Play
          </MenuItem>
          <MenuItem onClick={editScenario} disabled={!currentScenario}>
            Edit
          </MenuItem>
          <MenuItem onClick={deleteScenario} disabled={!currentScenario}>
            Delete
          </MenuItem>
          {VpsUser.role === AccessLevel.STAFF ? (
            <MenuItem onClick={openDashboard} disabled={!currentScenario}>
              Dashboard
            </MenuItem>
          ) : (
            ""
          )}
        </ContextMenu>
        <ListContainer
          data={data || scenarios}
          assignedScenarios={assignedScenarios || []}
          onItemSelected={setCurrentScenario}
          onItemDoubleClick={editScenario}
          onItemBlur={changeScenarioName}
          invalidNameId={invalidNameId}
        />
      </div>
    </ScreenContainer>
  );
}
