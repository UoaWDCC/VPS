import styles from "./PlayPageSideButton.module.scss";

export default function PlayPageSideButton({
  handleOpen,
  buttonName,
  variant,
}) {
  let buttonClass = styles.notes;

  if (variant === "notes") {
    buttonClass = styles.notes;
  } else if (variant === "resources") {
    buttonClass = styles.resources;
  }

  return (
    <div className={styles.buttons}>
      <ul className="menu bg-primary rounded-box">
        <li>
          <a className="tooltip tooltip-right" data-tip="Notes">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="black"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M.75,17.5A.751.751,0,0,1,0,16.75V12.569a.755.755,0,0,1,.22-.53L11.461.8a2.72,2.72,0,0,1,3.848,0L16.7,2.191a2.72,2.72,0,0,1,0,3.848L5.462,17.28a.747.747,0,0,1-.531.22ZM1.5,12.879V16h3.12l7.91-7.91L9.41,4.97ZM13.591,7.03l2.051-2.051a1.223,1.223,0,0,0,0-1.727L14.249,1.858a1.222,1.222,0,0,0-1.727,0L10.47,3.91Z" />
            </svg>
          </a>
        </li>
        <li>
          <a className="tooltip tooltip-right" data-tip="Resources">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="black"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10.24 23.84c-0.040 0-0.040 0-0.080 0-0.4-0.040-0.72-0.36-0.76-0.76l-1-9.96-0.88 2.72c-0.12 0.36-0.44 0.56-0.8 0.56h-5.88c-0.48 0-0.84-0.36-0.84-0.8s0.36-0.84 0.84-0.84h5.32l1.92-6c0.12-0.36 0.48-0.6 0.88-0.56s0.68 0.36 0.72 0.76l0.96 9.72 2.040-6.96c0.12-0.36 0.4-0.6 0.8-0.6 0.36 0 0.68 0.28 0.8 0.64l1.12 4.84 0.84-1.24c0.16-0.24 0.4-0.36 0.68-0.36h5.28c0.44 0 0.84 0.36 0.84 0.84 0 0.44-0.36 0.84-0.84 0.84h-4.84l-1.64 2.44c-0.2 0.28-0.52 0.4-0.84 0.36s-0.6-0.32-0.64-0.64l-0.84-3.6-2.36 8.080c-0.12 0.28-0.44 0.52-0.8 0.52z" />
            </svg>
          </a>
        </li>
      </ul>
    </div>
  );
}
