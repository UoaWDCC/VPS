import React, { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import SideBar from "../../components/SideBar";
import ListContainer from "../../components/ListContainer";
import ScreenContainer from "../../components/ScreenContainer";
import ScenarioContext from "../../context/ScenarioContext";
import { usePut } from "../../hooks/crudHooks";
import AuthenticationContext from "../../context/AuthenticationContext";

/**
 * Page that shows the user's existing scenarios.
 *
 * @container
 */
export default function ScenarioSelectionPage({ data = null }) {
  const { scenarios, currentScenario, setCurrentScenario, reFetch } =
    useContext(ScenarioContext);
  const { getUserIdToken } = useContext(AuthenticationContext);
  const history = useHistory();

  /** function is called when the user unfocuses from a scenario name */
  async function changeScenarioName({ target }) {
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

  /** function is called when the user double clicks */
  async function editScenario() {
    history.push(`/scenario/${currentScenario._id}`);
  }

  useEffect(() => {
    setCurrentScenario(null);
    reFetch();
  }, []);

  return (
    <ScreenContainer>
      <SideBar />
      <ListContainer
        data={data || scenarios}
        onItemSelected={setCurrentScenario}
        onItemDoubleClick={editScenario}
        onItemBlur={changeScenarioName}
      />
    </ScreenContainer>
  );
}
