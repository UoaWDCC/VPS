import React, { useContext, useEffect } from "react";
import {
  useParams,
  Route,
  useRouteMatch,
  Switch,
  useHistory,
} from "react-router-dom";
import { Button } from "@material-ui/core";
import TopBar from "../../components/TopBar";
import ListContainer from "../../components/ListContainer";
import ScreenContainer from "../../components/ScreenContainer";
import SceneContext from "../../context/SceneContext";
import AuthoringToolPage from "./AuthoringTool/AuthoringToolPage";
import { usePost } from "../../hooks/crudHooks";

export function SceneSelectionPage({ data = null }) {
  const { scenarioId } = useParams();
  const { url } = useRouteMatch();
  const history = useHistory();
  const { scenes, currentScene, setCurrentScene, reFetch } =
    useContext(SceneContext);

  async function createNewScene() {
    const newScene = await usePost(`/api/scenario/${scenarioId}/scene`, {
      name: `Scene ${scenes.length}`,
    });
    setCurrentScene(newScene);
    history.push({
      pathname: `${url}/scene/${newScene._id}`,
    });
  }

  async function editScene() {
    if (currentScene != null) {
      history.push({
        pathname: `${url}/scene/${currentScene._id}`,
      });
    }
  }

  useEffect(() => {
    setCurrentScene(null);
    if (reFetch) {
      reFetch();
    }
  }, []);

  return (
    <ScreenContainer vertical>
      <TopBar>
        <Button
          className="btn top outlined white"
          color="default"
          variant="outlined"
          onClick={editScene}
        >
          Edit
        </Button>
      </TopBar>
      <ListContainer
        data={data || scenes}
        onItemSelected={setCurrentScene}
        addCard={createNewScene}
        wide
      />
    </ScreenContainer>
  );
}

export function ScenePage() {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={path} component={SceneSelectionPage} />
      <Route path={`${path}/scene/:sceneId`} component={AuthoringToolPage} />
    </Switch>
  );
}
