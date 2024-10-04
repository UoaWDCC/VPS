import Button from "@material-ui/core/Button";
import { useContext, useState } from "react";
import { Link, Router, useHistory } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import AccessLevel from "../../enums/route.access.level";
import { useDelete, usePost } from "../../hooks/crudHooks";
import styles from "./SideBar.module.scss";
import HelpButton from "../HelpButton";
import CreateScenerioCard from "../CreateScenarioCard/CreateScenarioCard";
import DeleteModal from "../DeleteModal";

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
  const { signOut, getUserIdToken, VpsUser } = useContext(
    AuthenticationContext
  );
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
        name: `Scene 0`,
      },
      getUserIdToken
    );
    setCurrentScenario(newScenario);
    // eslint-disable-next-line no-underscore-dangle
    history.push(`/scenario/${newScenario._id}`);
  }

  /** Calls backend end point to switch to the lecturer's dashboard */
  function openDashboard() {}

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
      <div className={styles.sideBar}>
        <img
          draggable="false"
          className={styles.logo}
          src="uoa-logo.png"
          alt="University of Auckland Logo"
        />
        <ul className={styles.sideBarList}>
          <li>
            <button
              className="btn vps w-full"
              onClick={() => {
                handleOpenCard();
              }}
            >
              Create
            </button>
          </li>
          {VpsUser.role === AccessLevel.STAFF ? (
            <li>
              <button
                className="btn vps w-full"
                onClick={() => {
                  history.push("/dashboard");
                }}
                disabled={!currentScenario}
              >
                Dashboard
              </button>
            </li>
          ) : (
            ""
          )}
          <li>
            <button
              className="btn vps w-full"
              onClick={playScenario}
              disabled={!currentScenario}
            >
              Play
            </button>
          </li>
          <li>
            <button
              className="btn vps w-full"
              disabled={!currentScenario}
              onClick={() => {
                history.push(`/scenario/${currentScenario._id}`);
              }}
            >
              Edit
            </button>
          </li>
          <li>
            <DeleteModal
              onDelete={deleteScenario}
              currentScenario={currentScenario}
            />
          </li>
          <li>
            <button className="btn vps w-full" onClick={signOut}>
              Logout
            </button>
          </li>
          <li>
            <HelpButton isSidebar />
          </li>
        </ul>
      </div>
    </>
  );
}
