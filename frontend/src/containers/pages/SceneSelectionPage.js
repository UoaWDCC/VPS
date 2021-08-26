import React, { useContext, useEffect } from "react";
import {
  useParams,
  useHistory,
  Route,
  useRouteMatch,
  Switch,
} from "react-router-dom";
import DashedCard from "../../components/DashedCard";
import TopBar from "../../components/TopBar";
import ListContainer from "../../components/ListContainer";
import ScreenContainer from "../../components/ScreenContainer";
import SceneContext from "../../context/SceneContext";
import AuthoringToolPage from "./AuthoringToolPage";
import { usePost } from "../../hooks/crudHooks";

const axios = require("axios");

function SceneSelectionPage({ useTestData }) {
  const { scenarioId } = useParams();
  const { url } = useRouteMatch();
  const history = useHistory();
  const { scenes, setScenes, setCurrentScene } = useContext(SceneContext);

  useEffect(() => {
    if (useTestData) {
      // fill with dummy data
      const testData = [];
      for (let i = 1; i < 30; i += 1) {
        testData.push({
          id: i,
          name: `Scene ${i}`,
        });
      }
      setScenes(testData);
    } else if (scenarioId !== "changeThisToDynamicScenarioId") {
      // fetch scenarios
      axios.get(`/api/scenario/${scenarioId}/scene`).then((response) => {
        const processedData = [];
        response.data.map((item) =>
          processedData.push({
            // eslint-disable-next-line dot-notation
            id: item["_id"],
            name: item.name,
          })
        );
        setScenes(processedData);
      });
    } else {
      // TODO remove this else clause when Create button is implemented
      setScenes([]);
    }
  }, []);

  function createNewScene() {
    const post = usePost(`/api/scenario/${scenarioId}/scene`, {
      name: `Scene ${scenes.length}`,
    });

    useEffect(() => {
      setCurrentScene(post.data);
      history.push({
        pathname: `${url}/scene/ID2`,
        scenarioId,
      });
    }, [post.data]);
  }

  return (
    <ScreenContainer vertical>
      <TopBar />
      <ListContainer
        data={scenes}
        onItemSelected={setCurrentScene}
        addCard={{ DashedCard, createNewScene }}
        wide
      />
    </ScreenContainer>
  );
}

export default function ScenePage() {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={path} component={SceneSelectionPage} />
      <Route path={`${path}/scene/:sceneId`} component={AuthoringToolPage} />
    </Switch>
  );
}
