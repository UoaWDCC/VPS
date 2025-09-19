import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import { useGet } from "hooks/crudHooks";
import { useParams, useHistory } from "react-router-dom";
import { useState, useContext } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import DashTopBar from "./components/DashTopBar";
import HelpButton from "../../components/HelpButton";
import TestTable from "./components/Table";

/**
 * Could maybe add some info about the scenario? Who created what time, last edited, thumbnail of the scenario and an overlay edit button * which directs you to the edit page?
 * 
 * Todo: Need to add some type of message if no groups are assigned
 */

export default function Dashboard() {
    const { scenarioId } = useParams();
    const history = useHistory();
    const [scenarioGroupInfo, setScenarioGroupInfo] = useState([]);
    const { currentScenario,} = useContext(ScenarioContext);
    const {isLoading} = useGet(`/api/group/scenario/${scenarioId}`, setScenarioGroupInfo);
    const viewGroup = async (groupId) => {
        history.push(`/dashboard/${scenarioId}/view-group/${groupId}`);
    }


    const DashGroupInfo = ({groupData}) => {
        const totalGroups = groupData.length;
        const groupsNotStarted = groupData.filter((group) => group.path.length == 0).length;
        const groupsStarted = groupData.filter((group) => group.path.length != 0).length;
        // Placeholder here, needs an update for when the group completes a scenario it sets a var in the database, probs alr exist but will implement this later
        const groupsCompleted = 0;
        return (
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white col-auto border rounded-xl p-2 text-center">
                    <h3 className="text-xl font-mona font-bold">Groups</h3>
                    <p className="text-lg">{totalGroups}</p>
                </div>
                <div className="bg-gray-200 col-auto border rounded-xl p-2 text-center">
                    <h3 className="text-xl font-mona font-bold">Not Started</h3>
                    <p className="text-lg">{groupsNotStarted}</p>
                </div>
                <div className="bg-yellow-200 col-auto border rounded-xl p-2 text-center">
                    <h3 className="text-xl font-mona font-bold ">Started</h3>
                    <p className="text-lg">{groupsStarted}</p>
                </div>
                <div className="bg-green-300 col-auto border rounded-xl p-2 text-center">
                    <h3 className="text-xl font-mona font-bold">Completed</h3>
                    <p className="text-lg">{groupsCompleted}</p>
                </div>
            </div>
        );
    }
    // Is it better to just show a loading screen instead of conditionally rendering the content to stop it flashing?
    /**
     * Is it better to just show a loading screen instead of conditionally rendering the content to stop it     
     * flashing?
     * 
     * Todo: Add a button to the edit page and manage groups thingy :D
     */
    return (
        <>
            <ScreenContainer vertical>
                <DashTopBar>
                    {/* Need to change the help button to maybe be able to pass something down like have a file of help messages which can be accessed and passed down to be page specific */}
                    <HelpButton />
                </DashTopBar>
                    {!isLoading && (
                        <div className="w-full h-full px-10 py-7 overflow-y-scroll">
                            <h1 className="text-3xl font-mona font-bold my-3 flex items-center gap-3">{
                                scenarioGroupInfo.length == 0 ? (
                                    `No groups assgined for ${currentScenario.name}`
                                    ):(
                                        `Viewing ${scenarioGroupInfo.length} Group${scenarioGroupInfo.length == 1 ? "" : "s"} for ${currentScenario.name}`
                                    )
                                }
                            </h1>
                            <DashGroupInfo groupData={scenarioGroupInfo}/>
                            <TestTable groupInfo={scenarioGroupInfo} rowClick={viewGroup}/>
                        </div>
                    )}
            </ScreenContainer>
        </>
    );
}
