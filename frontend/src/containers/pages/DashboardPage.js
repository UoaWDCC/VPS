import React, { useContext } from "react";
import { Button } from "@material-ui/core";
import ScreenContainer from "../../components/ScreenContainer";
import AuthenticationContext from "../../context/AuthenticationContext";

export default function DashboardPage() {
  const authContext = useContext(AuthenticationContext);

  return (
    <ScreenContainer vertical>
      <Button>{authContext.VpsUser.role}</Button>
    </ScreenContainer>
  );
}
