import { getAuth } from "firebase/auth";

export async function getDownloadUrl(fileId) {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  const idToken = await user.getIdToken();
  return `/api/files/download/${fileId}?token=${encodeURIComponent(idToken)}`;
}
