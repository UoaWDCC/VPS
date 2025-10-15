import { useState, useContext, useEffect } from "react";
import ScenarioContext from "../../../context/ScenarioContext";
import DashGroupTable from "./table/DashGroupTable";
import StateVarTable from "./table/StateVarTable";

export default function ViewGroup({groupInfo}) {
  const [hasStateVar, setHasStateVar] = useState(false);
  const { stateVariables } = useContext(ScenarioContext);

  useEffect(() => {
    if (!Array.isArray(stateVariables)) return;
    if (stateVariables.length != 0) setHasStateVar(true);
  }, [stateVariables]);

  return (
    <div>
      {Object.keys(groupInfo) != 0 && (
        <div>
          <div className="pb-10">
            <h1 className="text-xl">Group Members</h1>
            <DashGroupTable groupInfo={groupInfo} />
          </div>
          <div>
            <h1 className="text-xl">State Variables</h1>
            <StateVarTable
              data={groupInfo.stateVariables}
              hasStateVar={hasStateVar}
            />
          </div>
        </div>
      )}
    </div>
  );
}
