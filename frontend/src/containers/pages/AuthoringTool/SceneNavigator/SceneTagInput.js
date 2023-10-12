import React from "react";
import styles from "styling/SceneNavigator.module.scss";
import { tagOptions } from "./SceneTagCustomization";

const SceneTagInput = ({
  selectedTagEl,
  changeTag,
  showingTagInputFor,
  showTagInputFor,
}) => {
  const selectedValue = tagOptions[selectedTagEl?.innerHTML] || "";

  const verticalPos = selectedTagEl
    ? `${selectedTagEl.getBoundingClientRect().top.toString()}px`
    : "50%";

  return (
    <div
      className={styles.popupForSceneTagInput}
      style={{
        "--vertical-pos": verticalPos,
      }}
    >
      <select
        defaultValue={selectedValue}
        onChange={(e) =>
          changeTag(showingTagInputFor, e.target.selectedOptions[0].value)
        }
      >
        {Object.keys(tagOptions).map((tagSymbol) => {
          return (
            <option key={tagSymbol} value={tagSymbol}>
              {tagOptions[tagSymbol]}
            </option>
          );
        })}
      </select>

      <button type="button" onClick={() => showTagInputFor(null)}>
        Close
      </button>
    </div>
  );
};

export default SceneTagInput;
