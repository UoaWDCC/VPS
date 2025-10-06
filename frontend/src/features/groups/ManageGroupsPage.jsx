import axios from "axios";
import { useGet } from "hooks/crudHooks";
import Papa from "papaparse";
import { useContext, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import GroupsTable from "./GroupTable";
import TopBar from "./TopBar";
import { ArrowLeftIcon, DownloadIcon, FileSpreadsheetIcon, UploadIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useHistory } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import GenericErrorPage from "../status/GenericErrorPage";
import LoadingPage from "../status/LoadingPage";

function convertToCSV(data, scenarioId) {
  const headers = ["email", "name", "role", "group number", "playable link"];
  const playableLink = `https://vps.wdcc.co.nz/play/${scenarioId}`;

  const rows = data.map(({ email = "", name = "", role = "", group = "" }) => [
    email,
    name,
    role,
    group,
    playableLink,
  ]);

  return [headers, ...rows].map(row => row.join(",")).join("\n");
};

async function getGroups(user, scenarioId) {
  const res = await api.get(user, `/api/group/scenario/${scenarioId}`);
  return res.data;
}

/**
 * Page that shows the groups that the admin can manipulate
 *
 * @container
 */
export default function ManageGroupsPage() {
  const { scenarioId } = useParams();
  const { user } = useContext(AuthenticationContext);

  const history = useHistory();

  const fileInputRef = useRef(null);

  // fetch groups assigned to this scenario
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryFn: () => getGroups(user, scenarioId),
    queryKey: ["groupData", scenarioId],
  });

  if (isLoading) {
    return <LoadingPage text="Getting groups information..." />;
  }

  if (isError) {
    console.error(error);
    return <GenericErrorPage />;
  }

  const users = data.flatMap(g => g.users);

  function handleFileUpload(event) {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data } = results;

        // Group data by 'group' field
        const groupMap = {};
        data.forEach((user) => {
          const { group } = user;
          if (group) {
            if (!groupMap[group]) {
              groupMap[group] = [];
            }
            groupMap[group].push({
              email: user.email,
              name: user.name,
              role: user.role,
              group: user.group,
            });
          }
        });

        const groupList = Object.values(groupMap);

        // Extract role list
        const roleList = [
          ...new Set(data.map((user) => user.role.toLowerCase())),
        ].filter((str) => str.trim() !== "");

        const jsonData = { groupList, roleList };

        // Send the parsed JSON data to the backend
        try {
          const response = await axios.post(
            `/api/group/${scenarioId}`,
            jsonData
          );

          reFetch();

          toast.success("Groups formed successfully!")
        } catch (error) {
          toast.error("There was an error uploading the .csv data")
          console.error("error uploading .csv data:", error.response.data);
        }
      },
    });
  };

  function upload() {
    fileInputRef.current.click();
  };

  function download() {
    const csv = convertToCSV(users, scenarioId);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "groups_data.csv";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  function downloadSample() {
    window.open(
      "https://firebasestorage.googleapis.com/v0/b/virtual-patient-simulator.appspot.com/o/_manual-uploads%2Ftesting_group.xlsx?alt=media&token=a9c61c46-c317-4c8c-b8b8-ba049f8c9ff3",
      "_blank",
      "noopener,noreferrer"
    )
  }

  function goBack() {
    history.push(`/scenario/${scenarioId}`);
  }

  return (
    <div className="font-ibm flex flex-col h-screen w-screen overflow-hidden gap-2xl">
      <div className="flex pt-l px-l">
        <button onClick={goBack} className="btn btn-phantom text-m">
          <ArrowLeftIcon size={20} />
          Back
        </button>
        <button onClick={upload} className="btn btn-phantom text-m ml-auto">
          <UploadIcon size={20} />
          Upload
        </button>
        <button onClick={download} className="btn btn-phantom text-m">
          <DownloadIcon size={20} />
          Download
        </button>
        <button onClick={downloadSample} className="btn btn-phantom text-m">
          <FileSpreadsheetIcon size={20} />
          Sample
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        className="hidden"
        onChange={handleFileUpload}
      />
      <div className="u-container w-full">
        <h1 className="text-xl mb-l">Uploaded Groups</h1>
        <GroupsTable data={users} />
      </div>
    </div>
  );
}
