import { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import MenuItem from "@material-ui/core/MenuItem";
import ContextMenu from "../../components/ContextMenu";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import AccessLevel from "../../enums/route.access.level";
import { useDelete } from "../../hooks/crudHooks";
import Thumbnail from "../authoring/components/Thumbnail";
import TopNavBar from "../../features/TopNavBar/TopNavBar";
import FabMenu from "../../components/FabMenu";
import { SearchIcon } from "lucide-react";

export default function PlayLandingPage() {
  const { allScenarios } = useContext(ScenarioContext);

  const { getUserIdToken, VpsUser } = useContext(AuthenticationContext); // Added signOut
  const history = useHistory();

  const [search, setSearch] = useState("");

  const scenarios = [allScenarios.owned, allScenarios.assigned, allScenarios.accessible].flat();

  const filteredScenarios = scenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleScenarioPlay = (scenario) => {
    history.push(`/scenario-info?id=${scenario._id}`);
  };

  return (
    <div className="bg-base-100 h-full text-base-content pt-5xl px-xl max-w-[1500px] mx-auto">
      <TopNavBar />

      {/* Header */}
      <h1 className="font-ibm text-xl mb-l">Play</h1>

      {/* Search Section */}
      <label className="input search w-full max-w-[40vw] mb-m ">
        <input
          type="search"
          placeholder="Search scenarios"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          required
        />
        <SearchIcon size={20} />
      </label>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] xl:grid-cols-4 gap-x-l gap-y-xl pb-2xl">
        {filteredScenarios.map((scenario) => (
          <div
            key={scenario._id}
            className="cursor-pointer hover:-translate-y-1 duration-100 ease"
            onClick={() => handleScenarioPlay(scenario)}
          >
            <div className="aspect-16/9 rounded overflow-hidden mb-s border-primary/10 border-1">
              <Thumbnail components={scenario.thumbnail?.components || []} />
            </div>
            <p className="font-ibm text-l text-nowrap truncate">
              {scenario.name}
            </p>
          </div>
        ))}
      </div>

      <FabMenu />
    </div>
  );
}
