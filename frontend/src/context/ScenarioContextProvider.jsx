import { useContext, useEffect, useState } from "react";

import { useGet } from "../hooks/crudHooks";
import useLocalStorage from "../hooks/useLocalStorage";
import AuthenticationContext from "./AuthenticationContext";
import ScenarioContext from "./ScenarioContext";
import { api } from "../util/api";
import { ensureStateVariableUUIDs } from "../components/StateVariables/migrationUtils";

/**
 * This is a Context Provider made with the React Context API
 * ScenarioContextProvider allows access to scenario info and the refetch function
 */
export default function ScenarioContextProvider({ children }) {
  const { user } = useContext(AuthenticationContext);
  const [currentScenario, setCurrentScenario] = useLocalStorage(
    "currentScenario",
    null
  );
  const [scenarios, setScenarios] = useState();
  const [assignedScenarios, setAssignedScenarios] = useState();
  const [roleList, setRoleList] = useState();
  const [stateVariables, setStateVariables] = useState();

  const { reFetch } = useGet(`api/scenario`, setScenarios, true, !user);
  const { reFetch: reFetch2 } = useGet(
    `api/scenario/assigned`,
    setAssignedScenarios,
    true,
    !user
  );

  const { reFetch: reFetch3 } = useGet(
    `api/group/${currentScenario?._id}/roleList`,
    setRoleList,
    true,
    !currentScenario // Skip request if there is no current scenario.
  );

  // We may load before the auth is ready, refetch if we did.
  useEffect(() => {
    if (user) {
      reFetch();
      reFetch2();
      reFetch3();
    }
  }, [user]);

  useEffect(() => {
    if (currentScenario?._id && user) {
      api
        .get(user, `api/scenario/${currentScenario._id}/stateVariables`)
        .then((res) => {
          // Ensure all state variables have UUIDs for backward compatibility
          const stateVariablesWithUUIDs = ensureStateVariableUUIDs(res.data);
          setStateVariables(stateVariablesWithUUIDs);
        })
        .catch((error) => {
          console.error("Error fetching state variables:", error);
        });
    } else {
      setStateVariables([]);
    }
  }, [currentScenario, user]);

  return (
    <ScenarioContext.Provider
      value={{
        scenarios,
        setScenarios,
        reFetch,
        assignedScenarios,
        setAssignedScenarios,
        reFetch2,
        currentScenario,
        setCurrentScenario,
        roleList,
        stateVariables,
        setStateVariables,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
