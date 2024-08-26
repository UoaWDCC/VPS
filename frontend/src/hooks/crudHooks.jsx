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

async function deleteRecord(
  token,
  url,
  setResponse,
  setError,
  setLoading,
  callBack
) {
  setError(null);
  setLoading(true);
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const res = await axios.delete(url, config);
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

async function fetch(
  token,
  setResponse,
  setError,
  setLoading,
  url,
  requestBody,
  callBack,
  isPost
) {
  setError(null);
  setLoading(true);
  try {
    let config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    let request = axios.get(url, config);
    if (isPost) {
      request = axios.post(url, requestBody, config);
    }
    let res = await request;
    // if the response is 401, refresh the token and try again
    if (res.status === 401) {
      token = await refreshToken();
      if (token) {
        config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        request = axios.get(url, config);
        if (isPost) {
          request = axios.post(url, requestBody, config);
        }
        res = await request;
      }
    }
    setResponse(res.data);
    if (callBack) {
      callBack(res.data);
    }
  } catch (e) {
    if (callBack) {
      callBack(null, e.response);
    }
    setError(e.response);
  } finally {
    setLoading(false);
  }
}

/**
 * A custom hook which fetches data from the given URL. With built in authentication
 */

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
      await fetch(
        token,
        setResponse,
        setError,
        setLoading,
        url,
        requestBody,
        callBack,
        true
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
      await fetch(
        token,
        setResponse,
        setError,
        setLoading,
        url,
        requestBody,
        callBack,
        false
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

  const deleteRequest = async () => {
    const token = await getToken(user, authLoading, authError);
    if (token) {
      await deleteRecord(
        token,
        url,
        setResponse,
        setError,
        setLoading,
        callBack
      );
    }
  };
  return { response, loading, error, deleteRequest };
}

/**
 * Code below handles the server URL for axios calls when .env file is missing
 * When .env file is missing, React will take the proxy route as server URL as defined in package.json
 */
if (process.env.REACT_APP_SERVER_URL === undefined) {
  axios.defaults.baseURL = "/";
} else {
  axios.defaults.baseURL = `${process.env.REACT_APP_SERVER_URL}`;
}

/**
 * A custom hook which fetches data from the given URL. Includes functionality to determine
 * whether the data is still being loaded or not.
 * Code adapted from SOFTENG750 lab4 https://gitlab.com/cs732-s1c/cs732-labs/cs732-lab-04/-/blob/master/frontend/src/hooks/useGet.js
 */
export function useGet(url, setData, requireAuth = true) {
  const [isLoading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);
  const { getUserIdToken } = useContext(AuthenticationContext);

  function reFetch() {
    setVersion(version + 1);
  }

  useEffect(() => {
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

      if (!hasError) {
        setData(response.data);
      }

      setLoading(false);
    }
    fetchData();
  }, [url, version]);

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
