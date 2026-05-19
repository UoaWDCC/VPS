import { getAuth } from "firebase/auth";

export async function getDownloadUrl(fileId) {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  const idToken = await user.getIdToken();
  const path = `/api/files/download/${fileId}?token=${encodeURIComponent(idToken)}`;
  const backendUrl = new URL(path, import.meta.env.VITE_SERVER_URL).href;
  return backendUrl;
}
