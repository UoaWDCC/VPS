import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import ScenarioContext from "../../../context/ScenarioContext";
import { useGet } from "../../../hooks/crudHooks";
import DashGroupTable from "./DashGroupTable";
import StateVarTable from "./StateVarTable";

export default function ViewGroup() {
  const { groupId } = useParams();
  const [groupInfo, setGroupInfo] = useState({});
  const [hasStateVar, setHasStateVar] = useState(false);
  const { stateVariables } = useContext(ScenarioContext);
  useGet(`/api/group/retrieve/${groupId}`, setGroupInfo, true);

  useEffect(() => {
    if (!Array.isArray(stateVariables)) return;
    if (stateVariables.length != 0) setHasStateVar(true);
  }, [stateVariables]);

  return (
    <div>
      {Object.keys(groupInfo) != 0 && (
        <div>
          <DashGroupTable groupInfo={groupInfo} />
          <StateVarTable
            data={groupInfo.stateVariables}
            hasStateVar={hasStateVar}
          />
        </div>
      )}
    </div>
  );
}
