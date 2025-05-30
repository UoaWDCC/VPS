import axios from "axios";
import { useContext, useEffect, useState } from "react";
import AuthenticationContext from "../context/AuthenticationContext";

/**
 * this function filters network request errors (to the ones we care about)
 *
 * @param {object} error - contains error message + error response
 * @returns {boolean}
 */
function isRealError(error) {
  return (
    !error.response ||
    error.response.status === 404 ||
    error.response.status === 409 ||
    error.response.status === 401
  );
}

function getConfig(token, data) {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  if (data) {
    config.data = data;
  }
  return config;
}

async function getToken(user, authLoading, authError) {
  // return false if loading or error or no user
  if (user && !(authLoading || authError)) {
    const userToken = await user.getIdToken();
    if (userToken) {
      return userToken;
    }
  }
  return false;
}

async function refreshToken(user) {
  const userToken = await user.refreshAuthToken();
  if (userToken) {
    return userToken;
  }
  return false;
}

async function sendRequest(
  token,
  setResponse,
  setError,
  setLoading,
  url,
  requestBody,
  callBack,
  method
) {
  setError(null);
  setLoading(true);
  try {
    let res;
    if (method === "get" || method === "delete") {
      res = await axios[method](url, getConfig(token, requestBody));
    } else {
      res = await axios[method](url, requestBody, getConfig(token));
    }
    if (res.status === 401) {
      token = await refreshToken();
      if (token) {
        if (method === "get" || method === "delete") {
          res = await axios[method](url, getConfig(token, requestBody));
        } else {
          res = await axios[method](url, requestBody, getConfig(token));
        }
      }
    }
    setResponse(res.data);
    if (callBack) {
      callBack(res.data);
    }
  } catch (e) {
    setError(e.response);
    if (callBack) {
      callBack(null, e.response);
    }
  } finally {
    setLoading(false);
  }
}

export function useAuthPost(url, callBack) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const {
    user,
    loading: authLoading,
    error: authError,
  } = useContext(AuthenticationContext);

  const postRequest = async (requestBody) => {
    const token = await getToken(user, authLoading, authError);
    if (token) {
      await sendRequest(
        token,
        setResponse,
        setError,
        setLoading,
        url,
        requestBody,
        callBack,
        "post"
      );
    }
  };
  return { response, loading, error, postRequest };
}

export function useAuthGet(url, callBack) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const {
    user,
    loading: authLoading,
    error: authError,
  } = useContext(AuthenticationContext);

  const getRequest = async (requestBody) => {
    const token = await getToken(user, authLoading, authError);
    if (token) {
      await sendRequest(
        token,
        setResponse,
        setError,
        setLoading,
        url,
        requestBody,
        callBack,
        "get"
      );
    }
  };
  return { response, loading, error, getRequest };
}

/**
 * A custom hook which deletes data with the given URL. With built in authentication
 * */
export function useAuthDelete(url, callBack) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const {
    user,
    loading: authLoading,
    error: authError,
  } = useContext(AuthenticationContext);

  const deleteRequest = async (requestBody) => {
    const token = await getToken(user, authLoading, authError);
    if (token) {
      await sendRequest(
        token,
        setResponse,
        setError,
        setLoading,
        url,
        requestBody,
        callBack,
        "delete"
      );
    }
  };
  return { response, loading, error, deleteRequest };
}

export function useAuthPut(url, callBack) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const {
    user,
    loading: authLoading,
    error: authError,
  } = useContext(AuthenticationContext);

  const putRequest = async (requestBody) => {
    const token = await getToken(user, authLoading, authError);
    if (token) {
      await sendRequest(
        token,
        setResponse,
        setError,
        setLoading,
        url,
        requestBody,
        callBack,
        "put"
      );
    }
  };
  return { response, loading, error, putRequest };
}

/**
 * Code below handles the server URL for axios calls when .env file is missing
 * When .env file is missing, React will take the proxy route as server URL as defined in package.json
 */
if (import.meta.env.VITE_SERVER_URL === undefined) {
  axios.defaults.baseURL = "/";
} else {
  axios.defaults.baseURL = `${import.meta.env.VITE_SERVER_URL}`;
}

/**
 * A custom hook which fetches data from the given URL. Includes functionality to determine
 * whether the data is still being loaded or not.
 * Code adapted from SOFTENG750 lab4 https://gitlab.com/cs732-s1c/cs732-labs/cs732-lab-04/-/blob/master/frontend/src/hooks/useGet.js
 *
 * skipRequest: a boolean that skips the request if set to true.
 */
export function useGet(url, setData, requireAuth = true, skipRequest = false) {
  const [isLoading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);
  const { getUserIdToken } = useContext(AuthenticationContext);

  function reFetch() {
    setVersion(version + 1);
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      let hasError = false;
      setLoading(true);

      let config = {};
      let token = null;
      if (requireAuth) {
        token = await getUserIdToken();
        config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      }

      const response = await axios.get(url, config).catch((err) => {
        hasError = isRealError(err);
      });

      if (!hasError && isMounted) {
        setData(response.data);
      }

      setLoading(false);
    }

    // Only execute request if skipRequest is false!
    if (!skipRequest) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [url, skipRequest, version]);

  return { isLoading, reFetch };
}

/**
 * This function is a modified version of the above useGet function.
 * A simpler version with no auth or loading checking.
 * @param {*} url
 * @param {*} setData
 */
export function useGetSimplified(url, setData) {
  useEffect(() => {
    async function fetchData() {
      let hasError = false;

      const response = await axios.get(url).catch((err) => {
        hasError = isRealError(err);
      });

      if (!hasError) {
        setData(response.data);
      }
    }
    fetchData();
  }, [url]);
}

/**
 * A custom hook which posts data to the given URL.
 * Code adapted from SOFTENG750 lab4 https://gitlab.com/cs732-s1c/cs732-labs/cs732-lab-04/-/blob/master/frontend/src/hooks/useGet.js
 */
export function usePost(url, requestBody = null, getUserIdToken = null) {
  async function postData() {
    let errorData;
    let hasError = false;

    let config = {};
    if (getUserIdToken) {
      const token = await getUserIdToken();
      config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }

    const response = await axios.post(url, requestBody, config).catch((err) => {
      hasError = isRealError(err);
      errorData = hasError && err.response?.data;
    });

    return hasError ? errorData : response?.data;
  }

  return postData();
}

/**
 * A custom hook which puts data to the given URL.
 * Code adapted from SOFTENG750 lab4 https://gitlab.com/cs732-s1c/cs732-labs/cs732-lab-04/-/blob/master/frontend/src/hooks/useGet.js
 */
export function usePut(url, requestBody = null, getUserIdToken = null) {
  async function putData() {
    let errorData;
    let hasError = false;

    let config = {};
    if (getUserIdToken) {
      const token = await getUserIdToken();
      config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }

    const response = await axios.put(url, requestBody, config).catch((err) => {
      hasError = isRealError(err);
      errorData = hasError && err.response?.data;
    });

    return hasError ? errorData : response?.data;
  }

  return putData();
}

export function usePatch(url, requestBody = null, getUserIdToken = null) {
  async function patchData() {
    let errorData;
    let hasError = false;

    let config = {};
    if (getUserIdToken) {
      const token = await getUserIdToken();
      config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }

    const response = await axios
      .patch(url, requestBody, config)
      .catch((err) => {
        hasError = isRealError(err);
        errorData = hasError && err.response?.data;
      });

    return hasError ? errorData : response?.data;
  }

  return patchData();
}

/**
 * A custom hook which calls the given URL with HTTP DELETE method.
 * Code adapted from SOFTENG750 lab4 https://gitlab.com/cs732-s1c/cs732-labs/cs732-lab-04/-/blob/master/frontend/src/hooks/useGet.js
 */
export function useDelete(url, getUserIdToken = null) {
  async function deleteData() {
    let errorData;
    let hasError = false;

    let config = {};
    if (getUserIdToken) {
      const token = await getUserIdToken();
      config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }

    const response = await axios.delete(url, config).catch((err) => {
      hasError = isRealError(err);
      errorData = hasError && err.response?.data;
    });

    return hasError ? errorData : response?.data;
  }

  return deleteData();
}
