import React from "react";
import ScenarioContext from "./ScenarioContext";

export default function ScenarioContextProvider({ children }) {
  const dummyData = [
    {
      id: 1,
      name: "Scenario 1",
      img: "https://unidirectory.auckland.ac.nz/people/imageraw/n-giacaman/11018090/biggest",
    },
    {
      id: 2,
      name: "Scenario 2",
      img: "https://unidirectory.auckland.ac.nz/people/imageraw/reza-shahamiri/11450631/biggest",
    },
  ];

  for (let i = 3; i < 30; i += 1) {
    dummyData.push({
      id: i,
      name: `Scenario ${i}`,
      img: "",
    });
  }
  return (
    <ScenarioContext.Provider
      value={{
        scenarios: dummyData,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
