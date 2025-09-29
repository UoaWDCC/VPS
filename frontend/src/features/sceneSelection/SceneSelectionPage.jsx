import { Divider, MenuItem } from "@material-ui/core";
import ThumbnailList from "components/ListContainer/ThumbnailList";
import Papa from "papaparse";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Route,
  Switch,
  useHistory,
  useParams,
  useRouteMatch,
} from "react-router-dom";
import ContextMenu from "../../components/ContextMenu";
import HelpButton from "../../components/HelpButton";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import ShareModal from "../../components/ShareModal/ShareModal";
import TopBar from "../../components/TopBar/TopBar";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContext from "../../context/SceneContext";
import AccessLevel from "../../enums/route.access.level";
import {
  useDelete,
  useGet,
  usePatch,
  usePost,
  usePut,
} from "../../hooks/crudHooks";
import AuthoringToolPage from "../authoring/AuthoringToolPage";
import ManageResourcesPage from "../resources/ManageResourcesPage";

import {
  generateUniqueSceneName,
  isSceneNameDuplicate,
  generateDuplicateSceneName,
} from "../../utils/sceneUtils";

/**
 * Page that shows the scenes belonging to a scenario.
 *
 * @container
 */
export function SceneSelectionPage() {
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { scenarioId } = useParams();
  const { url } = useRouteMatch();
  const history = useHistory();
  const { currentScenario, setCurrentScenario } = useContext(ScenarioContext);
  const { scenes, currentScene, setCurrentScene, reFetch } =
    useContext(SceneContext);
  const { user, getUserIdToken, VpsUser } = useContext(AuthenticationContext);

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
