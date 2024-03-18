import styles from "styling/SceneNavigator.module.scss";
import { noTagSymbol, tagOptions } from "./SceneTagCustomization";

const SceneTagInput = ({
  selectedTagEl,
  changeTag,
  showingTagInputFor,
  showTagInputFor,
}) => {
  let selectedValue = selectedTagEl?.innerHTML || "";
  selectedValue =
    selectedValue === tagOptions[noTagSymbol] ? noTagSymbol : selectedValue;

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
