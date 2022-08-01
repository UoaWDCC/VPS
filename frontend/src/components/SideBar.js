import React, { useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
import ScenarioContext from "../context/ScenarioContext";
import styles from "../styling/SideBar.module.scss";
import { usePost, useDelete } from "../hooks/crudHooks";
import DeleteButton from "./DeleteButton";
import AuthenticationContext from "../context/AuthenticationContext";
import HelpButton from "./HelpButton";

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
    setCurrentScenario(newScenario);
    // eslint-disable-next-line no-underscore-dangle
    history.push(`/scenario/${newScenario._id}`);
  }

  /** Calls backend end point to switch to the lecturer's dashboard */
  // END POINT NOT CREATED YET
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

  return (
    <>
      <div className={styles.sideBar}>
        <img
          className={styles.logo}
          src="uoa-med-and-health-sci-logo.png"
          alt="UoA Medical & Health Science Logo"
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
          <li>
            <Button
              className="btn side contained white"
              color="default"
              variant="contained"
              onClick={openDashboard}
              // disabled={!authenticated}
            >
              Dashboard
            </Button>
          </li>
          <li>
            <Button
              className={`btn side contained white margin-top ${
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
