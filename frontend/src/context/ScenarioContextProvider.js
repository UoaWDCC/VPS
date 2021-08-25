import React, { useEffect, useState } from "react";
import ScenarioContext from "./ScenarioContext";

export default function ScenarioContextProvider({ useTestData, children }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (useTestData) {
      const testData = [
        {
          id: 1,
          name: "Scenario 1",
        },
        {
          id: 2,
          name: "Scenario 2",
        },
      ];

      for (let i = 3; i < 30; i += 1) {
        testData.push({
          id: i,
          name: `Scenario ${i}`,
        });
      }
      setData(testData);
    } else {
      fetch("api/scenario")
        .then((res) => res.json())
        .then(
          (result) => {
            console.log(result);
            const processedData = [];
            result.map((item) =>
              processedData.push({
                // eslint-disable-next-line dot-notation
                id: item["_id"],
                name: item.name,
              })
            );
            setData(processedData);
          },
          (error) => {
            console.error(error);
          }
        );
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
