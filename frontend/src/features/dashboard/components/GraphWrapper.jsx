import { useState } from "react";  
import ScenarioGraph from "./ScenarioGraph";
  import { Skeleton } from "@mui/material";
import { ReactFlowProvider } from "@xyflow/react";
export default function GraphWrapper({inNodes, inEdges, inGPathEdges, inGPath, inSceneMap}) {
    const [graphLoading, setGraphLoading] = useState(false);
    
    return(
        <div className="relative w-full h-[700px] ">
            {graphLoading &&
            (
            <div className="absolute w-full h-full top-6">
                <Skeleton
                animation="wave"
                width="100%"
                height="100%"
                variant="rectangular"
                sx={{ bgcolor: "#c2c2c2" }}
                />
            </div>

            )}
            <div className={`${graphLoading ? "opacity-0" : "opacity-100"}`}>
                <ReactFlowProvider>
                    <ScenarioGraph
                        inNodes={inNodes}
                        inEdges={inEdges}
                        inGPathEdges={inGPathEdges}
                        inGPath={inGPath}
                        inSceneMap={inSceneMap}
                        onLoaded={() => {
                        setGraphLoading(false);
                        }}
                        className="h-[700px]"
                    />
                </ReactFlowProvider>
            </div>
        </div>
    )
}