import styles from "./PlayPageSideButton.module.scss";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";

export default function PlayPageSideButton({ setNoteOpen, setResourcesOpen }) {
  return (
    <div className={styles.buttons}>
      <ul className="menu bg-primary rounded-box border-2 border-black">
        <li>
          <a
            className="tooltip tooltip-right"
            data-tip="Notes"
            onClick={setNoteOpen}
          >
            <NoteAltRoundedIcon />
          </a>
        </li>
        <li>
          <a
            className="tooltip tooltip-right"
            data-tip="Resources"
            onClick={setResourcesOpen}
          >
            <MonitorHeartRoundedIcon />
          </a>
        </li>
      </ul>
    </div>
  );
}
