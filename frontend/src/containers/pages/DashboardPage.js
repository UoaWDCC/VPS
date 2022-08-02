import React from "react";
import { Button } from "@material-ui/core";
import TopBar from "../../components/TopBar";
import ScreenContainer from "../../components/ScreenContainer";
import StaffAuth from "../../firebase/StaffAuth";

export default function DashboardPage() {
  return (
    <ScreenContainer vertical>
      <Button>TEST</Button>
      <StaffAuth />
    </ScreenContainer>
  );
}
