import React, { useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
import ScenarioContext from "../context/ScenarioContext";
import styles from "../styling/SideBar.module.scss";
import { usePost, useDelete } from "../hooks/crudHooks";
import DeleteButton from "./DeleteButton";

export default function SideBar() {
  const { currentScenario, setCurrentScenario, reFetch } =
    useContext(ScenarioContext);
  const history = useHistory();

  async function createScenario(name = "no name") {
    const newScenario = await usePost(`/api/scenario`, {
      name,
    });
    setCurrentScenario(newScenario);
    // eslint-disable-next-line no-underscore-dangle
    history.push(`/scenario/${newScenario._id}`);
  }

  async function deleteScenario() {
    await useDelete(`/api/scenario/${currentScenario._id}`);
    setCurrentScenario(null);
    reFetch();
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
              className={`btn side contained white ${
                currentScenario ? "" : "disabled"
              }  `}
              color="default"
              variant="contained"
              component={Link}
              to={
                currentScenario
                  ? `/play/${currentScenario._id}`
                  : "/scenario/null"
              }
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
        </ul>
      </div>
    </>
  );
}
