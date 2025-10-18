import { useState } from "react";
import { ChromePicker } from "react-color";
import { ClickAwayListener } from "@material-ui/core";
import PropTypes from "prop-types";

export default function ColourPickerComponent({
  value,
  onChange,
  disableAlpha = false,
  swatchSize = { width: 36, height: 24 },
}) {
  const [open, setOpen] = useState(false);

  const rgbaString = `rgba(${value.r}, ${value.g}, ${value.b}, ${value.a})`;

  const swatchStyle = {
    ...swatchSize,
    borderRadius: 2,
    cursor: "pointer",
    border: "1px solid #ddd",
    background: rgbaString,
  };

  const popoverStyle = {
    position: "absolute",
    zIndex: 1000,
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={swatchStyle} onClick={() => setOpen(!open)} />

      {open && (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <div style={popoverStyle}>
            <ChromePicker
              color={value}
              onChange={onChange}
              disableAlpha={disableAlpha}
            />
          </div>
        </ClickAwayListener>
      )}
    </div>
  );
}

ColourPickerComponent.propTypes = {
  value: PropTypes.shape({
    r: PropTypes.number,
    g: PropTypes.number,
    b: PropTypes.number,
    a: PropTypes.number,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  disableAlpha: PropTypes.bool,
  swatchSize: PropTypes.object,
};
