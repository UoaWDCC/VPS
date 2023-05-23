import React, { useContext, useEffect, useState } from "react";
import {
  useParams,
  Route,
  useRouteMatch,
  Switch,
  useHistory,
} from "react-router-dom";
import { Button, MenuItem, Divider } from "@material-ui/core";
import TopBar from "../../components/TopBar";
import ListContainer from "../../components/ListContainer";
import ScreenContainer from "../../components/ScreenContainer";
import SceneContext from "../../context/SceneContext";
import AuthoringToolPage from "./AuthoringTool/AuthoringToolPage";
import { usePost, usePut, useDelete } from "../../hooks/crudHooks";
import DeleteButton from "../../components/DeleteButton";
import ShareModal from "../../components/ShareModal";
import AuthoringToolContextProvider from "../../context/AuthoringToolContextProvider";
import AuthenticationContext from "../../context/AuthenticationContext";
import HelpButton from "../../components/HelpButton";
import ContextMenu from "../../components/ContextMenu";
import AccessLevel from "../../enums/route.access.level";

/**
 * Page that shows the scenes belonging to a scenario.
 *
 * @container
 */
export function SceneSelectionPage({ data = null }) {
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { scenarioId } = useParams();
  const { url } = useRouteMatch();
  const history = useHistory();
  const { scenes, currentScene, setCurrentScene, reFetch } =
    useContext(SceneContext);
  const { getUserIdToken, VpsUser } = useContext(AuthenticationContext);

  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  function handleContextMenu(event) {
    event.preventDefault();
    if (contextMenuPosition == null) {
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
    } else {
      setContextMenuPosition(null);
    }
  }

  /** called when the Add card is clicked */
  async function createNewScene() {
    const newScene = await usePost(
      `/api/scenario/${scenarioId}/scene`,
      {
        name: `Scene ${scenes.length}`,
      },
      getUserIdToken
    );

    setCurrentScene(newScene);
    history.push({
      pathname: `${url}/scene/${newScene._id}`,
    });
  }

  /** called when Edit button is clicked */
  async function editScene() {
    if (currentScene != null) {
      setCurrentScene(currentScene);
      history.push({
        pathname: `${url}/scene/${currentScene._id}`,
      });
    }
  }

  /** called when Delete button is clicked */
  async function deleteScene() {
    if (currentScene != null) {
      await useDelete(
        `/api/scenario/${scenarioId}/scene/${currentScene._id}`,
        getUserIdToken
      );
      setCurrentScene(null);
      reFetch();
    }
  }

  /** called when Duplicate button is clicked */
  async function duplicateScene() {
    await usePost(
      `/api/scenario/${scenarioId}/scene/duplicate/${currentScene._id}`,
      {},
      getUserIdToken
    );
    reFetch();
  }

  /** Calls backend end point to switch to the lecturer's dashboard */
  function openDashboard() {
    history.push("/dashboard");
  }

  /** called when Play button is clicked */
  function playScenario() {
    window.open(`/play/${scenarioId}`, "_blank");
  }

  /** called when user unfocuses from a scene name */
  async function changeSceneName({ target }) {
    await usePut(
      `/api/scenario/${scenarioId}/scene/${currentScene._id}`,
      {
        name: target.value,
      },
      getUserIdToken
    );
    reFetch();
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
        <DeleteButton
          className={`btn top contained ${currentScene ? "" : "disabled"}  `}
          color="default"
          variant="contained"
          disabled={!currentScene}
          onClick={deleteScene}
        >
          Delete
        </DeleteButton>
        <Button
          className={`btn top contained white ${
            currentScene ? "" : "disabled"
          }  `}
          color="default"
          variant="contained"
          disabled={!currentScene}
          onClick={editScene}
        >
          Edit
        </Button>
        <Button
          className={`btn top contained white ${
            currentScene ? "" : "disabled"
          }  `}
          color="default"
          variant="contained"
          disabled={!currentScene}
          onClick={duplicateScene}
        >
          Duplicate
        </Button>
        {VpsUser.role === AccessLevel.STAFF ? (
          <Button
            className="btn top contained white"
            color="default"
            variant="contained"
            onClick={openDashboard}
          >
            Dashboard
          </Button>
        ) : (
          ""
        )}
        <Button
          className="btn top contained white"
          color="default"
          variant="contained"
          onClick={playScenario}
        >
          Play
        </Button>
        <Button
          className="btn top contained white"
          color="default"
          variant="outlined"
          onClick={() => setShareModalOpen(true)}
        >
          Share
        </Button>
        <HelpButton />
      </TopBar>
      <div onContextMenu={handleContextMenu}>
        <ContextMenu
          items={[
            <MenuItem disabled={!currentScene} onClick={editScene} key="edit">
              Edit
            </MenuItem>,
            <MenuItem
              disabled={!currentScene}
              onClick={duplicateScene}
              key="duplicate"
            >
              Duplicate
            </MenuItem>,
            <MenuItem
              disabled={!currentScene}
              onClick={deleteScene}
              key="delete"
            >
              Delete
            </MenuItem>,
            <Divider />,
            VpsUser.role === AccessLevel.STAFF ? (
              <MenuItem onClick={openDashboard} key="dashboard">
                Dashboard
              </MenuItem>
            ) : (
              <div />
            ),
            <MenuItem onClick={playScenario} key="play">
              Play
            </MenuItem>,
            <MenuItem onClick={() => setShareModalOpen(true)} key="share">
              Share
            </MenuItem>,
          ]}
          position={contextMenuPosition}
          setPosition={setContextMenuPosition}
        />
        <ListContainer
          data={data || scenes}
          onItemSelected={setCurrentScene}
          onItemDoubleClick={editScene}
          addCard={createNewScene}
          wide
          onItemBlur={changeSceneName}
          sceneSelectionPage
          scenarioId={scenarioId}
        />
      </div>
      <ShareModal
        isOpen={isShareModalOpen}
        handleClose={() => setShareModalOpen(false)}
      />
    </ScreenContainer>
  );
}

export function ScenePage() {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={path} component={SceneSelectionPage} />
      <AuthoringToolContextProvider>
        <Route path={`${path}/scene/:sceneId`} component={AuthoringToolPage} />
      </AuthoringToolContextProvider>
    </Switch>
  );
}
