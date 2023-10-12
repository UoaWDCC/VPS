/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React, { useRef } from "react";
import styles from "styling/SceneNavigator.module.scss";
import { tagColours, tagOptions } from "./SceneTagCustomization";

const SceneListItem = ({
  sceneId,
  tag,
  thumbnail,
  showingTagInputFor,
  showTagInputFor,
  selectTagEl,
}) => {
  const tagRef = useRef(null);
  const fullTagRef = useRef(null);

  function toggleTagOnHover() {
    const tagEl = tagRef.current;
    const fullTagEl = fullTagRef.current;

    tagEl.classList.toggle(styles.hidden);
    fullTagEl.classList.toggle(styles.showing);
  }

  function toggleInputBox() {
    showTagInputFor(showingTagInputFor === sceneId ? null : sceneId);
    selectTagEl(showingTagInputFor === sceneId ? null : tagRef.current);
  }

  return (
    <li key={sceneId}>
      {thumbnail}
      <p
        className={styles.playersTag}
        style={{ borderColor: tagColours[tag] || "black" }}
        onMouseEnter={() => toggleTagOnHover(sceneId)}
        onClick={() => toggleInputBox(sceneId)}
        ref={tagRef}
      >
        {tag}
      </p>

      <p
        className={styles.playersTagFull}
        style={{ borderColor: tagColours[tag] || "black" }}
        onMouseLeave={() => toggleTagOnHover(sceneId)}
        onClick={() => toggleInputBox(sceneId)}
        ref={fullTagRef}
      >
        {tagOptions[tag]}
      </p>
    </li>
  );
};

export default SceneListItem;
