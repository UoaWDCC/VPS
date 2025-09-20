import { useContext, useState } from "react";
import { useHistory } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import { useDelete, usePost } from "../../hooks/crudHooks";
import CreateScenerioCard from "../CreateScenarioCard/CreateScenarioCard";
import DeleteModal from "../DeleteModal";
import HelpButton from "../HelpButton";
import styles from "./SideBar.module.scss";

import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

/**
 * Component used for navigation and executing actions located at the left side of the screen.
 *
 * @component
 * @example
 * return (
 *   <SideBar/ >
 * )
 */
export default function SideBar() {
  const { currentScenario, setCurrentScenario, reFetch } =
    useContext(ScenarioContext);
  const { signOut, getUserIdToken } = useContext(AuthenticationContext);
  const history = useHistory();

  /** Calls backend end point to create a new empty scenario. */
  async function createScenario(name = "no name") {
    const newScenario = await usePost(
      `/api/scenario`,
      {
        name,
      },
      getUserIdToken
    );
    await usePost(
      `/api/scenario/${newScenario._id}/scene`,
      {
        name: `Scene 1`,
      },
      getUserIdToken
    );
    setCurrentScenario(newScenario);

    history.push(`/scenario/${newScenario._id}`);
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

  /** Handle creat scenrio card visibility */
  const [isCardVisible, setIsCardVisible] = useState(false);
  function handleCloseCard() {
    setIsCardVisible(false);
  }
  function handleOpenCard() {
    setIsCardVisible(true);
  }

  return (
    <>
      {isCardVisible && (
        <CreateScenerioCard
          className="create-scenario-card"
          onCreate={createScenario}
          onClose={handleCloseCard}
        />
      )}

      {/* Main sidebar */}
      <div className={`${styles.sideBar} bg-uoa-blue `}>
        {/* UoA logo container */}
        <div className="flex-0 p-7">
          <img
            draggable="false"
            className={styles.logo}
            src="uoa-logo.png"
            alt="University of Auckland Logo"
          />
        </div>

        {/* Button containers */}
        <div className="flex flex-col w-full flex-1 justify-between pb-5">
          <ul className={`${styles.sideBarList}`}>
            <li>
              <button
                className="btn vps font-mono"
                onClick={() => {
                  handleOpenCard();
                }}
              >
                <AddCircleOutlineRoundedIcon />
                <span className="min-w-12">Create</span>
              </button>
            </li>
            <li>
              <button
                className="btn vps font-mono"
                onClick={playScenario}
                disabled={!currentScenario}
              >
                <PlayArrowRoundedIcon />
                <span className="min-w-12">Play</span>
              </button>
            </li>
            <li>
              <button
                className="btn vps font-mono"
                disabled={!currentScenario}
                onClick={() => {
                  history.push(`/scenario/${currentScenario._id}`);
                }}
              >
                <EditRoundedIcon />
                <span className="min-w-12">Edit</span>
              </button>
            </li>
            <li>
              {/* Need to add the stuff to check user role */}
              <button
                className="btn vps font-mono"
                disabled={!currentScenario}
                onClick={() => {
                  history.push(`/dashboard/${currentScenario._id}`);
                }}
              >
                <span className="min-w-12">Dashboard</span>
              </button>
            </li>
            <li>
              <DeleteModal
                onDelete={deleteScenario}
                currentScenario={currentScenario}
              />
            </li>
          </ul>

          <ul className={styles.sideBarList}>
            <li>
              <button className="btn vps font-mono" onClick={signOut}>
                <LogoutIcon /> <span className="min-w-13">Logout</span>
              </button>
            </li>
            <li>
              <HelpButton isSidebar />
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
