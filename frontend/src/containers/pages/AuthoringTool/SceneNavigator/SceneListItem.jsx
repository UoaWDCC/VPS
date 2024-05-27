/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

const SceneListItem = ({ sceneId, thumbnail }) => {
  return <li key={sceneId}>{thumbnail}</li>;
};

export default SceneListItem;
