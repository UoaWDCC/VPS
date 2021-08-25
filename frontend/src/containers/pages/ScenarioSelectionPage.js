import React from "react";
import SideBar from "../../components/SideBar";
import ListContainer from "../../components/ListContainer";
import RowContainer from "../../components/RowContainer";

export default function ScenarioSelectionPage() {
  const dummyData = [
    {
      id: 1,
      name: "scenario 1",
      img: "https://hatrabbits.com/wp-content/uploads/2017/01/random.jpg",
    },
    {
      id: 2,
      name: "scenario 2",
      img: "https://hatrabbits.com/wp-content/uploads/2017/01/random.jpg",
    },
  ];

  for (let i = 3; i < 30; i += 1) {
    dummyData.push({
      id: i,
      name: `scenario ${i}`,
      img: "",
    });
  }
  return (
    <RowContainer>
      <SideBar />
      <ListContainer data={dummyData} />
    </RowContainer>
  );
}
