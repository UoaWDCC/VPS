import Button from "@material-ui/core/Button";
import { useContext, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import AuthenticationContext from "../context/AuthenticationContext";
import ScenarioContext from "../context/ScenarioContext";
import AccessLevel from "../enums/route.access.level";
import { useDelete, usePost } from "../hooks/crudHooks";
import styles from "../styling/SideBar.module.scss";
import DeleteButton from "./DeleteButton";
import HelpButton from "./HelpButton";
import CreateScenerioCard from "./CreateScenarioCard";

/**
 * Component used for navigation and executing actions located at the left side of the screen.
 *
 * @component
 * @example
 * return (
 *   <SideBar/ >
 * )
 */
export default function SideBar({ toggleCreateCardVisibility }) {
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

  /** Handle creat scenrio card visibility */
  const [isCardVisible, setIsCardVisible] = useState(true);
  function handleCloseCard() {
    setIsCardVisible(false);
  }

  return (
    <>
      {isCardVisible && (
        <CreateScenerioCard
          className="create-scenario-card"
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
            <Button
              className="btn side contained white"
              color="default"
              variant="contained"
              onClick={() => {
                createScenario("default name");
              }}
            >
              Create
            </Button>
          </li>
          {VpsUser.role === AccessLevel.STAFF ? (
            <li>
              <Button
                className={`btn side contained white ${
                  currentScenario ? "" : "disabled"
                }  `}
                color="default"
                variant="contained"
                onClick={openDashboard}
                disabled={!currentScenario}
              >
                Dashboard
              </Button>
            </li>
          ) : (
            ""
          )}
          <li>
            <Button
              className={`btn side contained white ${
                currentScenario ? "" : "disabled"
              }  `}
              color="default"
              variant="contained"
              onClick={playScenario}
              disabled={!currentScenario}
            >
              Play
            </Button>
          </li>
          <li>
            <Button
              className={`btn side contained white ${
                currentScenario ? "" : "disabled"
              }  `}
              color="default"
              variant="contained"
              component={Link}
              to={
                currentScenario
                  ? `/scenario/${currentScenario._id}`
                  : "/scenario/null"
              }
              disabled={!currentScenario}
            >
              Edit
            </Button>
          </li>
          <li>
            <DeleteButton
              className="btn side contained"
              color="default"
              variant="contained"
              disabled={!currentScenario}
              onClick={deleteScenario}
            >
              Delete
            </DeleteButton>
          </li>
          <li>
            <Button
              className="btn side contained white"
              color="default"
              variant="contained"
              onClick={signOut}
            >
              Logout
            </Button>
          </li>
          <li>
            <HelpButton isSidebar />
          </li>
        </ul>
      </div>
    </>
  );
}
