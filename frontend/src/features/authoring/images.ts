import type { User } from "firebase/auth";
import type { AxiosResponse } from "axios";
import { api } from "../../util/api";
import type { UploadedFile } from "./types";

export async function getImages(user: User, scenarioId: string) {
  const response = (await api.get(
    user,
    `api/files/${scenarioId}/type/image`
  )) as AxiosResponse<UploadedFile[]>;
  return response.data;
}

export async function uploadImage(user: User, scenarioId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = (await api.post(
    user,
    `api/files/${scenarioId}`,
    formData
  )) as AxiosResponse<UploadedFile>;
  return response.data;
}
