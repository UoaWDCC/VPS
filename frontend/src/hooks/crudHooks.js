import { useState, useEffect } from "react";
import axios from "axios";

if (process.env.REACT_APP_SERVER_URL === undefined) {
  axios.defaults.baseURL = "/";
} else {
  axios.defaults.baseURL = `${process.env.REACT_APP_SERVER_URL}`;
}
// import { AppContext } from "../AppContextProvider";

/**
 * A custom hook which fetches data from the given URL. Includes functionality to determine
 * whether the data is still being loaded or not.
 * Code adapted from SOFTENG750 lab4 https://gitlab.com/cs732-s1c/cs732-labs/cs732-lab-04/-/blob/master/frontend/src/hooks/useGet.js
 */
export function useGet(url, setData) {
  //   const { firebaseUserIdToken } = useContext(AppContext);
  const [isLoading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);

  function reFetch() {
    setVersion(version + 1);
  }

  useEffect(() => {
    async function fetchData() {
      let hasError = false;
      setLoading(true);
      const response = await axios
        .get(url)
        // {
        //   headers: { Authorization: `Bearer ${firebaseUserIdToken}` },
        // })
        .catch((err) => {
          if (err.response.status === 404) {
            hasError = true;
          }
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

export function usePost(url, requestBody = null) {
  //   const { firebaseUserIdToken } = useContext(AppContext);

  async function postData() {
    let errorData;
    let hasError = false;
    const response = await axios
      .post(url, requestBody)
      // {
      //   headers: { Authorization: `Bearer ${firebaseUserIdToken}` },
      // })
      .catch((err) => {
        if (err.response.status === 404) {
          errorData = err.response.data;
          hasError = true;
        }
      });

    return hasError ? errorData : response?.data;
  }

  return postData();
}

export function usePut(url, requestBody = null) {
  //   const { firebaseUserIdToken } = useContext(AppContext);

  async function putData() {
    let errorData;
    let hasError = false;

    const response = await axios
      .put(url, requestBody)
      // {
      //   headers: { Authorization: `Bearer ${firebaseUserIdToken}` },
      // })
      .catch((err) => {
        if (err.response.status === 404) {
          errorData = err.response.data;
          hasError = true;
        }
      });

    return hasError ? errorData : response?.data;
  }

  return putData();
}

export function useDelete(url) {
  //   const { firebaseUserIdToken } = useContext(AppContext);

  async function deleteData() {
    let errorData;
    let hasError = false;

    const response = await axios
      .delete(url)
      // {
      //   headers: { Authorization: `Bearer ${firebaseUserIdToken}` },
      // })
      .catch((err) => {
        if (err.response.status === 404) {
          errorData = err.response.data;
          hasError = true;
        }
      });

    return hasError ? errorData : response?.data;
  }

  return deleteData();
}
