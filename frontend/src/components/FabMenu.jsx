import { useHistory } from "react-router-dom";
import { useState } from "react";
import {
  EllipsisVerticalIcon,
  MoonIcon,
  SunIcon,
  UsersRoundIcon,
} from "lucide-react";

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
      className="fixed bottom-xl right-xl z-3"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex flex-col items-end gap-4">
        <div className="p-2">
          <label
            className={`swap swap-rotate transition-all duration-300 w-12 h-12 rounded-xs rotate-45 cursor-pointer bg-base-100 border-1 border-primary ${open ? "opacity-100" : "opacity-0"} `}
          >
            <input
              type="checkbox"
              className="theme-controller"
              onChange={handleThemeToggle}
            />
            <SunIcon size={20} className="swap-off fill-current" />
            <MoonIcon size={20} className="swap-on fill-current" />
          </label>
        </div>
        <div className="p-2">
          <button
            className={`flex items-center justify-center transition-all duration-300 w-12 h-12 rounded-xs rotate-45 cursor-pointer bg-base-100 border-1 border-primary ${open ? "opacity-100" : "opacity-0"} `}
            onClick={() => history.push("/aboutus")}
            aria-label="About Us"
          >
            <UsersRoundIcon size={20} className="-rotate-45" />
          </button>
        </div>
        <div className="p-2">
          <button
            className={`flex items-center justify-center transition-all duration-300 w-12 h-12 rounded-xs rotate-45 cursor-pointer border-1 ${open ? "border-secondary bg-secondary text-base-100" : "border-primary bg-base-100"}`}
            aria-label="Open Menu"
          >
            <EllipsisVerticalIcon size={20} className="-rotate-45" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FabMenu;
