import { useContext, useEffect, useState } from "react";

import { useGet } from "../hooks/crudHooks";
import useLocalStorage from "../hooks/useLocalStorage";
import AuthenticationContext from "./AuthenticationContext";
import ScenarioContext from "./ScenarioContext";
import { api } from "../util/api";
import { ensureStateVariableUUIDs } from "../components/StateVariables/migrationUtils";
import { useQuery } from "@tanstack/react-query";
import LoadingPage from "../features/status/LoadingPage";

async function getAllScenarios(user) {
  const res = await api.get(user, `api/scenario/all`);
  return res.data;
}

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

  const [roleList, setRoleList] = useState();
  const [stateVariables, setStateVariables] = useState();

  const scenarioQuery = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => getAllScenarios(user),
  });

  const { reFetch: reFetch3 } = useGet(
    `api/group/${currentScenario?._id}/roleList`,
    setRoleList,
    true,
    !currentScenario // Skip request if there is no current scenario.
  );

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

  if (scenarioQuery.isLoading) {
    return <LoadingPage text="Getting scenarios..." />;
  };

  console.log(scenarioQuery.data);

  // TODO: expose purely as data object
  return (
    <ScenarioContext.Provider
      value={{
        scenarios: scenarioQuery.data?.owned,
        allScenarios: scenarioQuery.data,
        reFetch: scenarioQuery.refetch,
        accessScenarios: scenarioQuery.data?.accessible,
        dashAccessReFetch: scenarioQuery.refetch,
        assignedScenarios: scenarioQuery.data?.assigned,
        reFetch2: scenarioQuery.refetch,

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
