import { useContext } from "react";
import { useParams } from "react-router-dom";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContext from "../../context/SceneContext";
import { useGet } from "../../hooks/crudHooks";
import AuthoringToolPage from "../authoring/AuthoringToolPage";

/**
 * Page that shows the scenes belonging to a scenario.
 *
 * @container
 */
export function SceneSelectionPage() {
  const { scenarioId } = useParams();
  const { currentScenario, setCurrentScenario } = useContext(ScenarioContext);
  useContext(SceneContext);
  const { user } = useContext(AuthenticationContext);

  // Retrieve scenario on load
  useGet(
    `api/scenario/${scenarioId}`,
    setCurrentScenario,
    true,
    !(user && (!currentScenario || currentScenario?._id != scenarioId))
  );
}

export function ScenePage() {
  return <AuthoringToolPage />;
}
