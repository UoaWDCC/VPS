import axios from "axios";
import toast from "react-hot-toast";

/**
 * Handles the server URL for axios calls when the .env file is missing.
 * Without VITE_SERVER_URL, requests go through the dev-server proxy at "/".
 */
if (import.meta.env.VITE_SERVER_URL === undefined) {
  axios.defaults.baseURL = "/";
} else {
  axios.defaults.baseURL = `${import.meta.env.VITE_SERVER_URL}`;
}

export const api = {};

api.request = async function (user, config) {
  const token = await user.getIdToken();
  config.headers = {
    ...(config.headers || {}),
    Authorization: `Bearer ${token}`,
  };
  return axios.request(config);
};

api.get = async function (user, url, config = {}) {
  return api.request(user, { ...config, method: "get", url });
};

api.post = async function (user, url, data, config = {}) {
  return api.request(user, { ...config, method: "post", url, data });
};

api.put = async function (user, url, data, config = {}) {
  return api.request(user, { ...config, method: "put", url, data });
};

api.patch = async function (user, url, data, config = {}) {
  return api.request(user, { ...config, method: "patch", url, data });
};

api.delete = async function (user, url, config = {}) {
  return api.request(user, { ...config, method: "delete", url });
};

export function handleGeneric(error) {
  console.log(error.response || error.request || error.message);
  toast.error("Something went wrong communicating with the server.");
}
