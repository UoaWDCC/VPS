// ESLint gets confused due to .js class import
// eslint-disable-next-line import/no-named-as-default, import/no-named-as-default-member
import Graph from "models/Graph";
import { useEffect, useState } from "react";
import { useGet } from "./crudHooks";

/**
 * Custom hook to initialize the graph object.
 */
const useGraph = (scenarioId) => {
  const [isLoading, setIsLoading] = useState(true);
  const [graph, setGraph] = useState(null);
  const [fullScenes, setFullScenes] = useState(null);

  useGet(`api/scenario/${scenarioId}/scene/all`, setFullScenes, false);

  useEffect(() => {
    if (fullScenes !== null && graph === null) {
      setGraph(new Graph(fullScenes[0]._id, fullScenes));
      setIsLoading(false);
    }
  }, [fullScenes]);

  return { isLoading, graph };
};

export default useGraph;
