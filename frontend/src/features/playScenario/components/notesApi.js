import { api } from "../../../util/api";

export const notesQueryKey = (groupId) => ["notes", groupId];

export async function getNotes(user, groupId) {
  const { data } = await api.get(user, `/api/group/${groupId}/notes`);
  return data || [];
}

export function createNote(user, groupId, title) {
  return api.post(user, `/api/group/${groupId}/notes`, { title });
}

export function updateNote(user, groupId, noteId, fields) {
  return api.put(user, `/api/group/${groupId}/notes/${noteId}`, fields);
}

export function deleteNote(user, groupId, noteId) {
  return api.delete(user, `/api/group/${groupId}/notes/${noteId}`);
}
