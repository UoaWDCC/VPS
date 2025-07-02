import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import TopBar from "../../components/TopBar/TopBar";
import AccessLevel from "../../enums/route.access.level";
import AuthenticationContext from "../../context/AuthenticationContext";
import { useContext, useRef } from "react";
import { useParams } from "react-router-dom";

export default function ManageResourcesPage() {
  const { VpsUser } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();
  const fileInputRef = useRef(null);

  const upload = () => {
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      // Handle the uploaded CSV file here
      console.log("Uploading:", file.name);
    }
  };

  return (
    <ScreenContainer vertical>
      <TopBar back={`/scenario/${scenarioId}`}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: "none" }}
        />
        <button
          className="btn vps w-[100px]"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload
        </button>
      </TopBar>
    </ScreenContainer>
  );
}
