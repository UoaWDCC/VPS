import { useState, useEffect, useContext } from "react";
import axios from "axios";
// import { AppContext } from "../AppContextProvider";

/**
 * A custom hook which fetches data from the given URL. Includes functionality to determine
 * whether the data is still being loaded or not.
 * Code adapted from SOFTENG750 lab4 https://gitlab.com/cs732-s1c/cs732-labs/cs732-lab-04/-/blob/master/frontend/src/hooks/useGet.js
 */
export function useGet(url, initialState = null) {
  //   const { firebaseUserIdToken } = useContext(AppContext);
  const [data, setData] = useState(initialState);
  const [isLoading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);

  function reFetch() {
    setVersion(version + 1);
  }

  useEffect(() => {
    async function fetchData() {
      let errorData;
      let hasError = false;

      setLoading(true);
      const response = await axios
        .get(url)
        // {
        //   headers: { Authorization: `Bearer ${firebaseUserIdToken}` },
        // })
        .catch((err) => {
          if (err.response.status === 404) {
            errorData = err.response.data;
            hasError = true;
          }
        });

      setData(hasError ? errorData : response?.data);
      setLoading(false);
    }
    fetchData();
  }, [url, version]);

  return { data, isLoading, reFetch };
}

export function usePost(url, requestBody = null) {
  //   const { firebaseUserIdToken } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(false);

  async function fetchData() {
    let errorData;
    let hasError = false;
    setLoading(true);
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

    setData(hasError ? errorData : response?.data);
    setLoading(false);
  }

  fetchData();
  return { data, isLoading };
}

export function usePut(url, requestBody = null) {
  //   const { firebaseUserIdToken } = useContext(AppContext);
  const [data, setData] = useState(requestBody);
  const [isLoading, setLoading] = useState(false);

  async function fetchData() {
    let errorData;
    let hasError = false;
    setLoading(true);
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

    setData(hasError ? errorData : response?.data);
    setLoading(false);
  }

  fetchData();
  return { data, isLoading };
}
