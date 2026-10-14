import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { useParams } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api } from "../../util/api";
import toast from "react-hot-toast";
import { v4 as uuid } from "uuid";

async function getResources(user, scenarioId) {
  const res = await api.get(user, `/api/resources/${scenarioId}`);
  return res.data;
}

async function uploadFileResource(user, scenarioId, parentId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const fileResponse = await api.post(
    user,
    `api/files/${scenarioId}`,
    formData
  );

  const resourceResponse = await api.post(user, `api/resources/${scenarioId}`, {
    parentId,
    name: fileResponse.data.name,
    fileId: fileResponse.data._id,
  });
  return resourceResponse.data;
}

async function createResourceCollection(user, scenarioId, name) {
  const res = await api.post(user, `api/resources/${scenarioId}/collection`, {
    name,
  });
  return res.data;
}

async function removeResource(user, scenarioId, resourceId) {
  await api.delete(user, `/api/resources/${scenarioId}/${resourceId}`);
}

async function renameResource(user, scenarioId, resourceId, name) {
  const res = await api.patch(
    user,
    `/api/resources/${scenarioId}/${resourceId}`,
    { name }
  );
  return res.data;
}

export function useResources() {
  const { scenarioId } = useParams();
  const { user } = useContext(AuthenticationContext);
  const queryClient = useQueryClient();

  const resourcesQuery = useQuery({
    queryKey: ["resources", scenarioId],
    queryFn: () => getResources(user, scenarioId),
  });

  const addFileResourceMutation = useMutation({
    mutationFn: ({ parentId, file }) =>
      uploadFileResource(user, scenarioId, parentId, file),
    onMutate: async ({ parentId, file }) => {
      await queryClient.cancelQueries(["resources", scenarioId]);
      const tempId = `temp.${uuid()}`;
      const temp = { parentId, name: file.name, _id: tempId, type: "file" };
      queryClient.setQueryData(["resources", scenarioId], (prev) => [
        temp,
        ...(prev ?? []),
      ]);
      return { tempId };
    },
    onSuccess: () => queryClient.invalidateQueries(["resources", scenarioId]),
    onError: (e, _, context) => {
      const tempId = context?.tempId;
      if (tempId) {
        queryClient.setQueryData(["resources", scenarioId], (prev) =>
          (prev ?? []).filter((r) => r._id !== tempId)
        );
      }
      console.error(e);
      toast.error("Something went wrong uploading the document");
    },
  });

  const addResourceCollectionMutation = useMutation({
    mutationFn: (name) => createResourceCollection(user, scenarioId, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries(["resources", scenarioId]);
      const tempId = `temp.${uuid()}`;
      const temp = { name, _id: tempId, type: "collection", children: [] };
      queryClient.setQueryData(["resources", scenarioId], (prev) => [
        temp,
        ...(prev ?? []),
      ]);
      return { tempId };
    },
    onSuccess: () => queryClient.invalidateQueries(["resources", scenarioId]),
    onError: (e, _, context) => {
      const tempId = context?.tempId;
      if (tempId) {
        queryClient.setQueryData(["resources", scenarioId], (prev) =>
          (prev ?? []).filter((r) => r._id !== tempId)
        );
      }
      console.error(e);
      toast.error("Something went wrong creating the collection");
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId) => removeResource(user, scenarioId, resourceId),
    onMutate: async (resourceId) => {
      await queryClient.cancelQueries(["resources", scenarioId]);
      queryClient.setQueryData(["resources", scenarioId], (prev) =>
        (prev ?? []).filter(
          (r) => r._id !== resourceId && r.parentId !== resourceId
        )
      );
    },
    onError: (e) => {
      console.error(e);
      toast.error("Something went wrong deleting the document");
    },
    onSettled: () => queryClient.invalidateQueries(["resources", scenarioId]),
  });

  const renameResourceMutation = useMutation({
    mutationFn: ({ resourceId, name }) =>
      renameResource(user, scenarioId, resourceId, name),
    onMutate: async ({ resourceId, name }) => {
      await queryClient.cancelQueries(["resources", scenarioId]);
      const previous = queryClient.getQueryData(["resources", scenarioId]);
      queryClient.setQueryData(["resources", scenarioId], (prev) =>
        (prev ?? []).map((r) => (r._id === resourceId ? { ...r, name } : r))
      );
      return { previous };
    },
    onError: (e, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["resources", scenarioId], context.previous);
      }
      console.error(e);
      toast.error("Something went wrong renaming the document");
    },
    onSettled: () => queryClient.invalidateQueries(["resources", scenarioId]),
  });

  return {
    resourcesQuery,
    renameResourceMutation,
    deleteResourceMutation,
    addResourceCollectionMutation,
    addFileResourceMutation,
  };
}
