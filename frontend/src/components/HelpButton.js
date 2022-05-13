import React from "react";
import HelpIcon from "@material-ui/icons/Help";
import IconButton from "@material-ui/core/IconButton";

/**
 * Material UI IconButton for representing a help/info button.
 *
 * @component
 * @example
 * return (
 *   <HelpButton />
 * )
 */
const HelpButton = () => {
  return (
    <IconButton
      aria-label="help"
      onClick={() => console.log("Link help popup here!")}
      style={{ color: "white" }}
    >
      <HelpIcon />
    </IconButton>
  );
};

export default HelpButton;
