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
import AuthoringToolContextProvider from "../../context/AuthoringToolContextProvider";
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

// !! this should be handled by the backend instead
function generateUID() {
  const charSet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 28 }, () =>
    charSet.charAt(Math.floor(Math.random() * charSet.length))
  ).join("");
}

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

  // File input is a hidden input element that is activated via a click handler
  // This allows us to have an UI button that acts like a file <input> element.
  const fileInputRef = useRef(null);
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const usersData = results.data;
        usersData.forEach(async (userData) => {
          const { name, email } = userData;
          const uid = generateUID(); // Implement your UID generation logic
          const pictureURL = "null"; // Set the picture URL if available

          await usePost(
            `/api/user/`,
            {
              name,
              uid,
              email,
              pictureURL,
            },
            getUserIdToken
          );
          console.log(`User ${name} uploaded to MongoDB.`);
        });

        // add users to the scenario
        const userEmails = usersData.map((user) => user.email);
        await usePatch(
          `/api/user/assigned/${scenarioId}`,
          { userEmails },
          getUserIdToken
        );
        console.log("CSV data uploaded to MongoDB.");
      },
    });
  };

  // invalid name state stores the last item that had a null name, will display error message
  const [invalidNameId, setInvalidNameId] = useState(""); // invalidNameId is not used?

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
    await usePost(
      `/api/scenario/${scenarioId}/scene`,
      {
        name: `Scene ${scenes.length + 1}`,
      },

      getUserIdToken
    );
    reFetch();
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

  /** called when Groups button is clicked */
  function manageGroups() {
    console.log(url, scenarioId);
    history.push({
      pathname: `${url}/manage-groups`,
    });
  }

  /** called when user unfocuses from a scene name */
  async function changeSceneName({ target }) {
    // Prevents user from changing scene name to empty string or one of only spaces
    if (
      target.value === "" ||
      target.value === null ||
      target.value.trim() === ""
    ) {
      target.value = currentScene.name;
      setInvalidNameId(currentScene._id);
    } else {
      setInvalidNameId("");
    }
    await usePut(
      `/api/scenario/${scenarioId}/scene/${currentScene._id}`,
      {
        name: target.value,
        components: currentScene.components,
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
        {VpsUser.role === AccessLevel.STAFF ? (
          <button className="btn vps" onClick={openDashboard}>
            Dashboard
          </button>
        ) : (
          ""
        )}
        <button className="btn vps w-[100px]" onClick={manageGroups}>
          Groups
        </button>
        <button className="btn vps w-[100px]" onClick={playScenario}>
          Play
        </button>
        <button
          className="btn vps w-[100px]"
          onClick={() => setShareModalOpen(true)}
        >
          Share
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <HelpButton />
      </TopBar>

      {/* On top of the action button available in the top menu bar, we also override user's rightclick context menu to offer the same functionality. */}
      <div
        onContextMenu={handleContextMenu}
        className="w-full h-full px-10 py-7 overflow-y-scroll"
      >
        {/* Scene list */}
        <ThumbnailList
          data={scenes}
          onItemSelected={setCurrentScene}
          onItemDoubleClick={editScene}
          addCard={createNewScene}
          onItemBlur={changeSceneName}
          invalidNameId={invalidNameId}
        />

        {/* Custom context menu */}
        <ContextMenu
          position={contextMenuPosition}
          setPosition={setContextMenuPosition}
        >
          <MenuItem disabled={!currentScene} onClick={editScene}>
            Edit
          </MenuItem>
          <MenuItem disabled={!currentScene} onClick={duplicateScene}>
            Duplicate
          </MenuItem>
          <MenuItem disabled={!currentScene} onClick={deleteScene}>
            Delete
          </MenuItem>
          <MenuItem onClick={createNewScene}>Create New Scene</MenuItem>
          <Divider />
          {VpsUser.role === AccessLevel.STAFF ? (
            <MenuItem onClick={openDashboard}>Dashboard</MenuItem>
          ) : (
            ""
          )}
          <MenuItem onClick={playScenario}>Play</MenuItem>
          <MenuItem onClick={() => setShareModalOpen(true)}>Share</MenuItem>
        </ContextMenu>
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
