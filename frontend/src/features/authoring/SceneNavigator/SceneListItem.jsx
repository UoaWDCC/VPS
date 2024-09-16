const SceneListItem = ({ sceneId, thumbnail }) => {
  return <li key={sceneId}>{thumbnail}</li>;
};

export default SceneListItem;
