import { useState } from "react";
import { useGet } from "../hooks/crudHooks";
import useLocalStorage from "../hooks/useLocalStorage";
import ScenarioContext from "./ScenarioContext";

/**
 * This is a Context Provider made with the React Context API
 * ScenarioContextProvider allows access to scenario info and the refetch function
 */
export default function ScenarioContextProvider({ children }) {
  const [currentScenario, setCurrentScenario] = useLocalStorage(
    "currentScenario",
    null
  );
  const [scenarios, setScenarios] = useState();
  const [assignedScenarios, setAssignedScenarios] = useState();
  const [roleList, setRoleList] = useState();

  const { reFetch } = useGet(`api/scenario`, setScenarios);
  const { reFetch: reFetch2 } = useGet(
    `api/scenario/assigned`,
    setAssignedScenarios
  );

  const { reFetch: reFetch3 } = useGet(
    currentScenario ? `api/group/${currentScenario._id}/roleList` : null,
    currentScenario ? setRoleList : () => {}
  );

  return (
    <ScenarioContext.Provider
      value={{
        scenarios,
        setScenarios,
        reFetch,
        assignedScenarios,
        setAssignedScenarios,
        reFetch2,
        reFetch3,
        currentScenario,
        setCurrentScenario,
        roleList,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
