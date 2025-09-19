import MenuItem from "@material-ui/core/MenuItem";
import { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import ContextMenu from "../../components/ContextMenu";
import ThumbnailList from "../../components/ListContainer/ThumbnailList";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import SideBar from "../../components/SideBar/SideBar";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import AccessLevel from "../../enums/route.access.level";
import { useDelete, usePut } from "../../hooks/crudHooks";

import MovieFilterRoundedIcon from "@mui/icons-material/MovieFilterRounded";
import TheatersRoundedIcon from "@mui/icons-material/TheatersRounded";

/**
 * Page that shows the user's existing scenarios.
 *
 * @container
 */
export default function ScenarioSelectionPage() {
  const {
    scenarios: userScenarios,
    reFetch,
    assignedScenarios,
    reFetch2,
    currentScenario,
    setCurrentScenario,
  } = useContext(ScenarioContext);
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
    history.push(`/dashboard/${currentScenario._id}`);
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
      <div onContextMenu={handleContextMenu} className="w-full h-full">
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
            <MenuItem onClick={openDashboard} disabled={!currentScenario}>
              Dashboard
            </MenuItem>
          )}
        </ContextMenu>

        {/* Scenario List */}
        <div className="w-full h-full px-10 py-10 overflow-x-hidden overflow-y-scroll flex flex-col gap-10">
          {/* List of scenarios created by the logged-in user */}
          {userScenarios && (
            <div>
              <h1 className="text-3xl font-mona font-bold my-3 flex items-center gap-3">
                <MovieFilterRoundedIcon fontSize="large" /> Your Scenarios
              </h1>

              <div>
                <ThumbnailList
                  // data={userScenarios}
                  data={userScenarios.map((scenario) => {
                    scenario.components = scenario.thumbnail?.components || [];
                    return scenario;
                  })}
                  onItemSelected={setCurrentScenario}
                  onItemDoubleClick={editScenario}
                  onItemBlur={changeScenarioName}
                  invalidNameId={invalidNameId}
                />
              </div>
            </div>
          )}

          {/* List of scenarios assigned to the logged-in user */}
          {assignedScenarios && (
            <div>
              <h1 className="text-3xl font-mona font-bold my-3 flex items-center gap-3">
                <TheatersRoundedIcon fontSize="large" /> Assigned Scenarios
              </h1>
              <ThumbnailList
                data={assignedScenarios.map((scenario) => {
                  scenario.components = scenario.thumbnail?.components || [];
                  return scenario;
                })}
                onItemSelected={(scenario) => {
                  // For assigned scenarios, play the scenario on click.
                  window.open(`/play/${scenario._id}`, "_blank");
                }}
                invalidNameId={invalidNameId}
                highlightOnSelect={false}
              />
            </div>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}
