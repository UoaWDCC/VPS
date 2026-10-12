import { useContext, type Context } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import type { User } from "firebase/auth";
import AuthenticationContext from "../../../context/AuthenticationContext";
import { api } from "../../../util/api";
import type { Asset } from "./items.js";

const ASSETS_KEY = ["assets"];

/** The signed-in user's library. */
export function useAssets() {
  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);

  return useQuery({
    queryKey: ASSETS_KEY,
    queryFn: async () => {
      const response = (await api.get(user, "api/assets")) as AxiosResponse<
        Asset[]
      >;
      return response.data;
    },
    enabled: !!user,
  });
}

/** Uploads a file to the library, with tags as comma separated text. */
export function useUploadAsset() {
  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, tags }: { file: File; tags: string }) => {
      const form = new FormData();
      form.append("file", file);
      if (tags.trim()) form.append("tags", tags);

      const response = (await api.post(
        user,
        "api/assets",
        form
      )) as AxiosResponse<Asset>;
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
  });
}

/** Removes an upload from the library. Scenes already using it keep it. */
export function useDeleteAsset() {
  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      await api.delete(user, `api/assets/${assetId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
  });
}

/**
 * The message to show for a failed request: the server's own, if it sent one
 * ("unsupported file type: ..."), otherwise the fallback.
 */
export function failureMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { error?: unknown } } })
    ?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
}
