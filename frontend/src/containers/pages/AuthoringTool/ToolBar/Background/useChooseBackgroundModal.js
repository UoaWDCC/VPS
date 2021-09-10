import { useState } from "react";

const useChooseBackgroundModal = () => {
  const [isShowing, setIsShowing] = useState(false);

  function show() {
    console.log("setting to show");
    setIsShowing(true);
  }
  function hide() {
    console.log("setting to hide");
    setIsShowing(false);
  }

  return {
    isShowing,
    show,
    hide,
  };
};

export default useChooseBackgroundModal;
