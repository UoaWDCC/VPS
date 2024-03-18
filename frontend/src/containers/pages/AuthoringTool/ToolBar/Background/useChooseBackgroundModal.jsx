import { useState } from "react";
/**
 * This function manages the show/hide state of the ChooseBackgroundModal component
 * @returns {boolean} isShowing
 * @returns {function} show
 * @returns {function} hide
 */
const useChooseBackgroundModal = () => {
  const [isShowing, setIsShowing] = useState(false);

  function show() {
    setIsShowing(true);
  }
  function hide() {
    setIsShowing(false);
  }

  return {
    isShowing,
    show,
    hide,
  };
};

export default useChooseBackgroundModal;
