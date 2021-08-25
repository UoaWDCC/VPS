import React from "react";
import ScenarioContext from "./ScenarioContext";

export default function ScenarioContextProvider({ useTestData, children }) {
  let data;
  if (useTestData) {
    data = [
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
      data.push({
        id: i,
        name: `Scenario ${i}`,
        img: "",
      });
    }
  } else {
    // TODO replace with database call
    data = [
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
  }
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
