import { getAuth } from "firebase/auth";
import axios from "axios";
import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import TopBar from "../../components/TopBar/TopBar";

export default function ManageResourcesPage() {
  const { scenarioId } = useParams();
  const fileInputRef = useRef(null);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          toast.error("You must be logged in to view resources.");
          return;
        }

        const idToken = await user.getIdToken();

        const response = await fetch(
          `http://localhost:3000/api/resources/scenario/${scenarioId}`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to fetch resources.");
        }

        const data = await response.json();
        setResources(data);
      } catch (error) {
        toast.error("Error fetching resources: " + error.message);
      }
    };

    fetchResources();
  }, [scenarioId]);

  const upload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data } = results;
        console.log("Parsed CSV data:", data);

        try {
          const auth = getAuth();
          const user = auth.currentUser;

          if (!user) {
            toast.error("You must be logged in to upload.");
            return;
          }

          const idToken = await user.getIdToken();

          const response = await axios.post(
            `/api/resources/${scenarioId}`,
            data,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );

          console.log("Backend response:", response.data);
          toast.success(`Successfully uploaded ${data.length} resources!`);

          // re-fetch resources after upload
          setResources((prev) => [...prev, ...data]);
        } catch (error) {
          const msg = error?.response?.data || error.message || "Unknown error";
          toast.error(`Error uploading: ${msg}`);
        }
      },
    });
  };

  return (
    <ScreenContainer vertical>
      <TopBar back={`/scenario/${scenarioId}`}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <button className="btn vps w-[100px]" onClick={upload}>
          Upload
        </button>
      </TopBar>

      {/* TO DO */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Uploaded Resources</h2>
        {resources.length === 0 ? (
          <p>No resources uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {resources.map((resource, idx) => (
              <li key={idx} className="border p-2 rounded">
                {JSON.stringify(resource)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScreenContainer>
  );
}
