import React, { useContext, useEffect, useState } from "react";
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
        onItemBlur={changeScenarioName}
        invalidNameId={invalidNameId}
      />
    </ScreenContainer>
  );
}
