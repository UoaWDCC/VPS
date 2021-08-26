import React from "react";
import { useLocation } from "react-router-dom";
import TopBar from "../../components/TopBar";
import ScreenContainer from "../../components/ScreenContainer";

export default function AuthoringToolPage() {
  const location = useLocation();
  return (
    <>
      <ScreenContainer vertical>
        <TopBar back={`/scenario/${location.scenarioId}`} />
        <h1>Authoring Tool Page</h1>
      </ScreenContainer>
    </>
  );
}
