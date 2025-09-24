import HelpIcon from "@material-ui/icons/Help";
import { useState } from "react";

/**
 * Material UI IconButton for representing a help/info button.
 *
 * @component
 * @example
 * return (
 *   <HelpButton />
 * )
 */
const HelpButton = (props) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const { isSidebar } = props;

  return (
    <>
      <button
        className={`btn btn-outline btn-primary cursor-pointer gap-2 ${
          isSidebar ? "w-full" : ""
        }`}
        onClick={handleOpen}
      >
        <HelpIcon />
        Help
      </button>
      {open && (
        <dialog id="help_modal" className="modal modal-open">
          <form method="dialog" className="modal-box relative">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-black"
              onClick={handleClose}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center text-black">Help</h3>
            <div className="py-4 text-black">
              <p>
                Welcome to the Virtual Patient Simulator! To create a new
                scenario, click Create and start adding scenes. To play an
                existing scenario, click Play. To edit an existing scenario or
                the scenes within it, click Edit. To delete a scenario, click
                Delete.
              </p>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
};

export default HelpButton;
