import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import ScenarioContext from "../../../context/ScenarioContext";
import { useGet } from "../../../hooks/crudHooks";
import DashGroupTable from "./table/DashGroupTable";
import StateVarTable from "./table/StateVarTable";

export default function ViewGroup({groupInfo}) {
  const { groupId } = useParams();
  const [hasStateVar, setHasStateVar] = useState(false);
  const { stateVariables } = useContext(ScenarioContext);
  // useGet(`/api/group/retrieve/${groupId}`, setGroupInfo, true);

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
