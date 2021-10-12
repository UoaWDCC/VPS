import { useState, useEffect } from "react";

/**
 * This custom hook allows the functionality of storing data in local storage
 * @param {string} key - The key of the data being stored in local storage
 * @param {*} initialValue - The initial value of the data
 */
export default function useLocalStorage(key, initialValue = null) {
  const [value, setValue] = useState(() => {
    try {
      const data = window.localStorage.getItem(key);
      return data ? JSON.parse(data) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [value, setValue]);

  return [value, setValue];
}
