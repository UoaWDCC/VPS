import { useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { ensurePropertyUUIDs } from "../components/Properties/migrationUtils";
import { api } from "../util/api";

import AuthenticationContext from "./AuthenticationContext";
import ScenarioContext from "./ScenarioContext";
import LoadingPage from "../features/status/LoadingPage";
import { useParams } from "react-router-dom";

async function getAllScenarios(user) {
  const res = await api.get(user, `api/scenario/all`);
  return res.data;
}

async function createScenario(user, details) {
  const { data: scenario } = await api.post(user, `/api/scenario`, details);
  return scenario._id;
}

function deleteScenario(user, scenarioId) {
  return api.delete(user, `/api/scenario/${scenarioId}`);
}

function updateScenarioDetails(user, scenarioId, details) {
  return api.patch(user, `/api/scenario/${scenarioId}`, details);
}

export const rolesQueryKey = (scenarioId) => ["roles", scenarioId];
export const propertiesQueryKey = (scenarioId) => ["properties", scenarioId];

async function getRoleList(user, scenarioId) {
  const res = await api.get(user, `api/scenario/${scenarioId}/roles`);
  return res.data;
}

async function getProperties(user, scenarioId) {
  const res = await api.get(user, `api/scenario/${scenarioId}/properties`);
  // Ensure all properties have UUIDs for backward compatibility
  return ensurePropertyUUIDs(res.data);
}

/**
 * This is a Context Provider made with the React Context API
 * ScenarioContextProvider allows access to scenario info and the refetch function
 */
export default function ScenarioContextProvider({ children }) {
  const { user } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();

  const queryClient = useQueryClient();

  const scenarioQuery = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => getAllScenarios(user),
  });

  const createMutation = useMutation({
    mutationFn: (details) => createScenario(user, details),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
    onError: () => {
      toast.error("Something went wrong creating the scenario.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteScenario(user, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["scenarios"] });
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
      await queryClient.cancelQueries({ queryKey: ["scenarios"] });
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

  // Both queries are skipped when there is no current scenario.
  const rolesQuery = useQuery({
    queryKey: rolesQueryKey(scenarioId),
    queryFn: () => getRoleList(user, scenarioId),
    enabled: Boolean(scenarioId && user),
  });

  // TODO: this should also exist as prop of the scenario instead
  const propertiesQuery = useQuery({
    queryKey: propertiesQueryKey(scenarioId),
    queryFn: () => getProperties(user, scenarioId),
    enabled: Boolean(scenarioId && user),
  });

  if (scenarioQuery.isLoading) {
    return <LoadingPage text="Getting scenarios..." />;
  }

  return (
    <ScenarioContext.Provider
      value={{
        allScenarios: scenarioQuery.data,

        deleteScenario: deleteMutation.mutate,
        updateScenarioDetails: updateDetailsMutation.mutateAsync,
        createScenario: createMutation.mutateAsync,

        roleList: rolesQuery.data,
        properties: scenarioId ? propertiesQuery.data : [],
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
