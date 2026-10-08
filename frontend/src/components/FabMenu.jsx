import { useHistory } from "react-router-dom";
import { useState } from "react";
import {
  EllipsisVerticalIcon,
  MoonIcon,
  SunIcon,
  UsersRoundIcon,
} from "lucide-react";

const FabMenu = ({ className }) => {
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
      className={`fixed z-3 ${open ? "pointer-events-auto" : "pointer-events-none"} ${className}`}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex flex-col items-end gap-2">
        <div className="p-2">
          <button
            onMouseEnter={() => setOpen(true)}
            className={`flex items-center justify-center transition-all duration-300 rounded-xs rotate-45 cursor-pointer border-1 pointer-events-auto w-8 h-8 ${open ? "border-secondary bg-secondary text-base-100" : "border-primary bg-base-100"}`}
            aria-label="Open Menu"
          >
            <EllipsisVerticalIcon size={16} className="-rotate-45" />
          </button>
        </div>
        <div className="p-2">
          <label
            className={`swap swap-rotate transition-all duration-300 rounded-xs rotate-45 cursor-pointer bg-base-100 border-1 border-primary w-8 h-8 ${open ? "opacity-100" : "opacity-0 pointer-events-none"} `}
          >
            <input
              type="checkbox"
              className="theme-controller"
              onChange={handleThemeToggle}
            />
            <SunIcon size={16} className="swap-off fill-current" />
            <MoonIcon size={16} className="swap-on fill-current" />
          </label>
        </div>
        <div className="p-2">
          <button
            className={`flex items-center justify-center transition-all duration-300 rounded-xs rotate-45 cursor-pointer bg-base-100 border-1 border-primary w-8 h-8 ${open ? "opacity-100" : "opacity-0 pointer-events-none"} `}
            onClick={() => history.push("/aboutus")}
            aria-label="About Us"
          >
            <UsersRoundIcon size={16} className="-rotate-45" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FabMenu;
