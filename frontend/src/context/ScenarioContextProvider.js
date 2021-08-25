import React, { useEffect, useState } from "react";
import axios from "axios";
import ScenarioContext from "./ScenarioContext";

export default function ScenarioContextProvider({ useTestData, children }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (useTestData) {
      // fill with dummy data
      const testData = [];
      for (let i = 1; i < 30; i += 1) {
        testData.push({
          id: i,
          name: `Scenario ${i}`,
        });
      }
      setData(testData);
    } else {
      // fetch scenarios
      axios.get("api/scenario").then((response) => {
        const processedData = [];
        response.data.map((item) =>
          processedData.push({
            // eslint-disable-next-line dot-notation
            id: item["_id"],
            name: item.name,
          })
        );
        setData(processedData);
      });
    }
  }, []);

  return (
    <ScenarioContext.Provider
      value={{
        scenarios: data,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
