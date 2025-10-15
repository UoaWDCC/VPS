import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import LightMode from "@mui/icons-material/LightMode";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useHistory } from "react-router-dom";
import { useEffect, useState } from "react";

const FabMenu = () => {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", "vps-dark");
  }, []);
  const history = useHistory();

  const handleThemeToggle = () => {
    const html = document.documentElement;
    if (html.getAttribute("data-theme") === "vps-dark") {
      html.setAttribute("data-theme", "vps-light");
    } else {
      html.setAttribute("data-theme", "vps-dark");
    }
  };

  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-8 right-8 z-50"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex flex-col items-end gap-4">
        <button
          className={`shadow-lg flex items-center justify-center transition-all duration-300 mb-2 ${open ? "opacity-100" : "opacity-0 pointer-events-none"} w-[2.2rem] h-[2.2rem] rounded-[2px] rotate-45 cursor-pointer`}
          style={{
            background: "var(--color-base-100)",
            border: "2px solid var(--color-primary)",
            boxShadow: "var(--color-base-content-box-shadow)",
          }}
          onClick={handleThemeToggle}
          aria-label="Toggle Theme"
        >
          <span className="flex items-center justify-center">
            <LightMode
              className="text-[1.2rem]"
              style={{ color: "var(--color-base-primary)" }}
            />
          </span>
        </button>
        <button
          className={`shadow-lg flex items-center justify-center transition-all duration-300 mb-2 ${open ? "opacity-100" : "opacity-0 pointer-events-none"} w-[2.2rem] h-[2.2rem] rounded-[2px] rotate-45 cursor-pointer`}
          style={{
            background: "var(--color-secondary)",
            border: "2px solid var(--color-secondary)",
            boxShadow: "var(--color-base-content-box-shadow)",
          }}
          onClick={() => history.push("/aboutus")}
          aria-label="About Us"
        >
          <span
            className="flex items-center justify-center"
            style={{ transform: "rotate(-45deg)" }}
          >
            <EmojiPeopleIcon
              className="text-[1.2rem]"
              style={{ color: "var(--color-base-100)" }}
            />
          </span>
        </button>
        <button
          className={`shadow-lg flex items-center justify-center transition-all duration-300 w-[2.2rem] h-[2.2rem] rounded-[2px] rotate-45 cursor-pointer`}
          style={{
            background: open
              ? "var(--color-secondary)"
              : "var(--color-base-100)",
            border: "2px solid var(--color-primary)",
            boxShadow: "var(--color-base-content-box-shadow)",
          }}
          aria-label="Open Menu"
        >
          <span
            className="flex items-center justify-center"
            style={{ transform: "rotate(-45deg)" }}
          >
            {open ? (
              <MoreVertIcon
                className="text-[1.2rem]"
                style={{ color: "var(--color-base-100)" }}
              />
            ) : (
              <MoreVertIcon
                className="text-[1.2rem]"
                style={{ color: "var(--color-secondary)" }}
              />
            )}
          </span>
        </button>
      </div>
    </div>
  );
};

export default FabMenu;
