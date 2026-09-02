import { useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useGet } from "../hooks/crudHooks";
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

/**
 * This is a Context Provider made with the React Context API
 * ScenarioContextProvider allows access to scenario info and the refetch function
 */
export default function ScenarioContextProvider({ children }) {
  const { user } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();

  const queryClient = useQueryClient();

  const [roleList, setRoleList] = useState();
  const [properties, setProperties] = useState();

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

  useGet(
    `api/scenario/${scenarioId}/roles`,
    setRoleList,
    true,
    !scenarioId // Skip request if there is no current scenario.
  );

  // TODO: this should also exist as prop of the scenario instead
  useEffect(() => {
    if (scenarioId && user) {
      api
        .get(user, `api/scenario/${scenarioId}/properties`)
        .then((res) => {
          // Ensure all properties have UUIDs for backward compatibility
          const propertiesWithUUIDs = ensurePropertyUUIDs(res.data);
          setProperties(propertiesWithUUIDs);
        })
        .catch((error) => {
          console.error("Error fetching properties:", error);
        });
    } else {
      setProperties([]);
    }
  }, [scenarioId, user]);

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

        roleList,
        setRoleList,
        properties,
        setProperties,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
