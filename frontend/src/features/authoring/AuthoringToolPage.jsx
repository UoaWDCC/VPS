import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SceneContext from "context/SceneContext";
import CanvasSideBar from "./CanvasSideBar/CanvasSideBar";
import SceneNavigator from "./SceneNavigator/SceneNavigator";

import Canvas from "./canvas/Canvas";
import Topbar from "./topbar/Topbar";
import useVisualScene from "./stores/visual";
import { copy, cut, paste } from "./handlers/keyboard/clipboard";
import useEditorStore from "./stores/editor";
import { useHistory } from "react-router-dom";
import { replace, replaceComponent } from "./scene/operations/modifiers";
import { diffToSelection, findEditDiff } from "./scene/operations/text";
import { syncVisualCursor } from "./text/cursor";
import {
  ArrowLeftIcon,
  FilesIcon,
  LayoutDashboardIcon,
  PencilIcon,
  PlayIcon,
  UserPlusIcon,
} from "lucide-react";
import { handleGlobal } from "./handlers/keyboard/keyboard";
import { clearHistory, historyEvents } from "./scene/history";
import { debounce } from "../../util/debounce";
import { getScene } from "./scene/scene";
import ShareModal from "./components/ShareModal";
import ScenarioContext from "../../context/ScenarioContext";
import ModalDialog from "../../components/ModalDialogue";
import DetailEditModal from "../scenarioInfo/components/DetailEditModal";

const listeners = [
  ["copy", copy],
  ["cut", cut],
  ["paste", paste],
  ["keydown", handleGlobal],
];

// const AUTOSAVE_INTERVAL = 30000; // 30 secs

/**
 * This page allows the user to edit a scene.
 * @container
 */
export default function AuthoringToolPage() {
  const { scenes, modifyScene, switchScene } = useContext(SceneContext);
  const { allScenarios, updateScenarioDetails } = useContext(ScenarioContext);
  const { scenarioId } = useParams();

  const sceneId = useVisualScene((scene) => scene.id);
  const setSelected = useEditorStore((state) => state.setSelected);

  const history = useHistory();

  const [saving, setSaving] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const pendingSavesRef = useRef(0);

  // NOTE: this is both the autosaver and the history actioner, which are distinct
  // operations, but are both here due to the limitations of the scene context
  useEffect(() => {
    const debounced = debounce(async () => {
      try {
        pendingSavesRef.current++;
        await modifyScene(getScene());
      } finally {
        pendingSavesRef.current--;
        if (pendingSavesRef.current === 0) setSaving(false);
      }
    }, 2500);

    const listener = async ({ operation, record }) => {
      if (operation === "undo" || operation === "redo") {
        const editorState = useEditorStore.getState();

        // React 17 doesn't batch these updates outside of an event handler,
        // so the text cursor/selection must be cleared before the document
        // is replaced -- otherwise a render can happen in between with the
        // restored (possibly shorter) document and the stale selection,
        // reading past the end of the document
        editorState.setSelection({ start: null, end: null });
        editorState.setVisualSelection({ start: null, end: null });

        const batch = record;
        const targetSceneId = batch[0]?.sceneId;
        if (targetSceneId && targetSceneId !== sceneId) {
          switchScene(getScene(), targetSceneId);
        }

        const restoredIds = [];
        batch.forEach((item) => {
          const state = operation === "undo" ? item.before : item.after;
          replaceComponent(item.id, state);
          if (state !== null) restoredIds.push(item.id);
        });
        setSelected(restoredIds);

        // jump straight to the exact text that was undone/redone, the way
        // undo/redo works in any text editor, by diffing the before/after
        // documents rather than relying on wherever the cursor used to be
        // -- only meaningful when the batch touches a single component
        if (batch.length === 1) {
          const [item] = batch;
          const state = operation === "undo" ? item.before : item.after;
          const beforeBlocks = item.before?.document?.blocks;
          const afterBlocks = item.after?.document?.blocks;
          const targetBlocks = state?.document?.blocks;
          const diff =
            beforeBlocks?.length && afterBlocks?.length
              ? findEditDiff(beforeBlocks, afterBlocks)
              : null;
          if (diff && targetBlocks?.length) {
            const selection = diffToSelection(targetBlocks, diff);
            editorState.setMode(["text"]);
            editorState.setSelection(selection);
            syncVisualCursor();
          }
        }
      }

      setSaving(true);
      debounced();
    };

    historyEvents.addEventListener("update", listener);
    return () => historyEvents.removeEventListener("update", listener);
  }, [sceneId, switchScene, setSelected, modifyScene]);

  // if the active scene was deleted, switch to the first available scene
  useEffect(() => {
    if (!sceneId || !scenes) return;
    if (!scenes.find((s) => s._id === sceneId)) {
      const next = scenes[0];
      if (next) {
        useEditorStore.getState().clear();
        replace(next);
      }
    }
  }, [scenes]);

  useEffect(() => {
    const activeScene = localStorage.getItem(`${scenarioId}:activeScene`);
    const found = activeScene
      ? scenes.find((s) => s._id === activeScene)
      : null;
    const target = found ?? scenes[0];
    if (target) replace(target);

    useEditorStore.getState().clear();

    clearHistory();

    listeners.forEach(([event, fn]) => document.addEventListener(event, fn));

    return () => {
      listeners.forEach(([event, fn]) =>
        document.removeEventListener(event, fn)
      );
    };
  }, []);

  function playScenario() {
    const startScene = sceneId ? `?startScene=${sceneId}` : "";
    window.open(`/play/${scenarioId}${startScene}`, "_blank");
  }

  function goToResources() {
    history.push(`/scenario/${scenarioId}/manage-resources`);
  }

  function goToDashboard() {
    history.push(`/dashboard/${scenarioId}?from=canvas`);
  }

  function goBack() {
    history.push("/create");
  }

  async function save() {
    setSaving(true);
    try {
      await modifyScene(getScene());
    } finally {
      setSaving(false);
    }
  }

  const ownedScenario = allScenarios?.owned.find((s) => s._id === scenarioId);
  const isOwner = Boolean(ownedScenario);

  return (
    <>
      <div className="font-ibm flex flex-col h-screen w-screen overflow-hidden gap-m">
        <div className="flex pt-l px-l">
          <button onClick={goBack} className="btn btn-phantom text-m">
            <ArrowLeftIcon size={20} />
            Back
          </button>
          {isOwner && (
            <div className="flex flex-1 min-w-0">
              <button
                onClick={() => setShowEditModal(true)}
                className="btn btn-phantom text-m max-w-full min-w-0"
              >
                <PencilIcon size={20} className="shrink-0" />
                <span className="min-w-0 truncate">{ownedScenario.name}</span>
              </button>
            </div>
          )}
          <button
            onClick={goToResources}
            className="btn btn-phantom text-m ml-auto"
          >
            <FilesIcon size={20} />
            Resources
          </button>
          <button onClick={goToDashboard} className="btn btn-phantom text-m">
            <LayoutDashboardIcon size={20} />
            Dashboard
          </button>
          {isOwner && (
            <button
              onClick={() => setShareModalOpen(true)}
              className="btn btn-phantom text-m"
            >
              <UserPlusIcon size={20} />
              Share
            </button>
          )}
          <button onClick={playScenario} className="btn btn-phantom text-m">
            <PlayIcon size={20} />
            Play
          </button>
        </div>
        <div className="flex flex-col gap-m px-l flex-1 min-h-0">
          <Topbar saving={saving} save={save} />
          <div className="flex gap-m flex-1 min-h-0">
            <SceneNavigator />
            <Canvas />
            <CanvasSideBar />
          </div>
        </div>
      </div>
      {isOwner && (
        <ShareModal open={shareModalOpen} setOpen={setShareModalOpen} />
      )}
      {isOwner && (
        <ModalDialog
          title="Edit Scenario Details"
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
        >
          <DetailEditModal
            scenario={ownedScenario}
            onSave={(details) =>
              updateScenarioDetails({ id: scenarioId, details })
            }
            onClose={() => setShowEditModal(false)}
          />
        </ModalDialog>
      )}
    </>
  );
}
