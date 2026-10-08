import { useState, useContext, useEffect } from "react";
import ScenarioContext from "../../../context/ScenarioContext";
import DashGroupTable from "./table/DashGroupTable";
import PropertyTable from "./table/PropertyTable";

export default function ViewGroup({ groupInfo }) {
  const [hasStateVar, setHasStateVar] = useState(false);
  const { properties } = useContext(ScenarioContext);

  useEffect(() => {
    if (!Array.isArray(properties)) return;
    if (properties.length != 0) setHasStateVar(true);
  }, [properties]);

  return (
    <div>
      {Object.keys(groupInfo) != 0 && (
        <div>
          <div className="pb-10">
            <h1 className="text-xl">Group Members</h1>
            <DashGroupTable groupInfo={groupInfo} />
          </div>
          <div>
            <h1 className="text-xl">Properties</h1>
            <PropertyTable
              data={groupInfo.stateVariables}
              hasStateVar={hasStateVar}
            />
          </div>
        </div>
      )}
    </div>
  );
}
