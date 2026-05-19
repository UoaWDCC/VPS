import { useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useGet } from "../hooks/crudHooks";
import useLocalStorage from "../hooks/useLocalStorage";
import { ensureStateVariableUUIDs } from "../components/StateVariables/migrationUtils";
import { api } from "../util/api";

import AuthenticationContext from "./AuthenticationContext";
import ScenarioContext from "./ScenarioContext";
import LoadingPage from "../features/status/LoadingPage";

async function getAllScenarios(user) {
  const res = await api.get(user, `api/scenario/all`);
  return res.data;
}

// TODO: this should be unionised into a single endpoint for efficiency
async function createScenario(user, name) {
  const { data: scenario } = await api.post(user, `/api/scenario`, { name });
  await api.post(user, `/api/scenario/${scenario._id}/scene`, {
    name: "Scene 1",
  });
  return scenario._id;
}

function deleteScenario(user, scenarioId) {
  return api.delete(user, `/api/scenario/${scenarioId}`);
}

function updateScenarioDetails(user, scenarioId, details) {
  return api.patch(user, `/api/scenario/${scenarioId}`, details);
}

/**
 * This is a Context Provider made with the React Context API
 * ScenarioContextProvider allows access to scenario info and the refetch function
 */
export default function ScenarioContextProvider({ children }) {
  const { user } = useContext(AuthenticationContext);

  const queryClient = useQueryClient();

  // INFO: purely for compat with old components, delete alongside old home page
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

  const createMutation = useMutation({
    mutationFn: (name) => createScenario(user, name),
    onSuccess: () => {
      return queryClient.invalidateQueries(["scenarios"]);
    },
    onError: () => {
      toast.error("Something went wrong creating the scenario.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteScenario(user, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(["scenarios"]);
      queryClient.setQueryData(["scenarios"], (prev) => ({
        ...prev,
        owned: prev.owned.filter((s) => s._id !== id),
      }));
    },
    onError: () => {
      toast.error(
        "Something went wrong updating the scenario, your last changes weren't saved"
      );
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: ({ id, details }) => updateScenarioDetails(user, id, details),
    onMutate: async ({ id, details }) => {
      await queryClient.cancelQueries(["scenarios"]);
      queryClient.setQueryData(["scenarios"], (prev) => ({
        ...prev,
        owned: prev.owned.map((s) => (s._id === id ? { ...s, ...details } : s)),
      }));
    },
    onError: () => {
      toast.error(
        "Something went wrong updating the scenario, your last changes weren't saved"
      );
    },
  });

  // TODO: this should be divorced from the "uploaded" groups and exist as prop of the scenario instead
  useGet(
    `api/group/${currentScenario?._id}/roleList`,
    setRoleList,
    true,
    !currentScenario // Skip request if there is no current scenario.
  );

  // TODO: this should also exist as prop of the scenario instead
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
  }

  return (
    <ScenarioContext.Provider
      value={{
        allScenarios: scenarioQuery.data,

        deleteScenario: deleteMutation.mutate,
        updateScenarioDetails: updateDetailsMutation.mutate,
        createScenario: createMutation.mutateAsync,

        roleList,
        stateVariables,
        setStateVariables,

        // INFO: compat with old stuff only, delete alongside
        scenarios: scenarioQuery.data?.owned,
        accessScenarios: scenarioQuery.data?.accessible,
        dashAccessReFetch: scenarioQuery.refetch,
        assignedScenarios: scenarioQuery.data?.assigned,
        reFetch: scenarioQuery.refetch,
        reFetch2: scenarioQuery.refetch,
        currentScenario,
        setCurrentScenario,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
