import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import LightMode from "@mui/icons-material/LightMode";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useHistory } from "react-router-dom";
import { useState } from "react";

const FabMenu = () => {
  const history = useHistory();

  const handleThemeToggle = () => {
    const html = document.documentElement;
    if (html.getAttribute("data-theme") === "vps-dark") {
      html.setAttribute("data-theme", "vps-light");
      localStorage.setItem("vps-theme", "vps-light");
    } else {
      html.setAttribute("data-theme", "vps-dark");
      localStorage.setItem("vps-theme", "vps-dark");
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
          className={`shadow-lg flex items-center justify-center transition-all duration-300 mb-2 ${open ? "opacity-100" : "opacity-0 pointer-events-none"} w-[2.2rem] h-[2.2rem] rounded-[2px] rotate-45 cursor-pointer bg-base-100 border-[2px] border-primary`}
          style={{
            boxShadow: "var(--color-base-content-box-shadow)",
          }}
          onClick={handleThemeToggle}
          aria-label="Toggle Theme"
        >
          <span className="flex items-center justify-center">
            <LightMode className="text-[1.2rem] text-base-primary" />
          </span>
        </button>
        <button
          className={`shadow-lg flex items-center justify-center transition-all duration-300 mb-2 ${open ? "opacity-100" : "opacity-0 pointer-events-none"} w-[2.2rem] h-[2.2rem] rounded-[2px] rotate-45 cursor-pointer bg-secondary border-[2px] border-secondary`}
          style={{
            boxShadow: "var(--color-base-content-box-shadow)",
          }}
          onClick={() => history.push("/aboutus")}
          aria-label="About Us"
        >
          <span className="flex items-center justify-center -rotate-45">
            <EmojiPeopleIcon className="text-[1.2rem] text-base-100" />
          </span>
        </button>
        <button
          className="shadow-lg flex items-center justify-center transition-all duration-300 w-[2.2rem] h-[2.2rem] rounded-[2px] rotate-45 cursor-pointer border-[2px] border-primary"
          style={{
            background: open
              ? "var(--color-secondary)"
              : "var(--color-base-100)",
            boxShadow: "var(--color-base-content-box-shadow)",
          }}
          aria-label="Open Menu"
        >
          <span className="flex items-center justify-center -rotate-45">
            <MoreVertIcon
              className={`text-[1.2rem] ${open ? "text-base-100" : "text-secondary"}`}
            />
          </span>
        </button>
      </div>
    </div>
  );
};

export default FabMenu;
