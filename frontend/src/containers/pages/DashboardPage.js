import React from "react";
import { Button } from "@material-ui/core";
import ScreenContainer from "../../components/ScreenContainer";
import Table from "./DashboardPageDummyData";

export default function DashboardPage() {
  function returnToSceneSelection() {}

  return (
    <ScreenContainer vertical>
      <Button
        className="btn contained white"
        color="default"
        variant="outlined"
        onClick={returnToSceneSelection}
      >
        Back
      </Button>
      <Table />
    </ScreenContainer>
  );
}
