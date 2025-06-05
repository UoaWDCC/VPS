import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import TopBar from "../../components/TopBar/TopBar";
import AccessLevel from "../../enums/route.access.level";
import AuthenticationContext from "../../context/AuthenticationContext";
import { useContext } from "react";

export default function ManageResourcesPage() {
  const { VpsUser } = useContext(AuthenticationContext);

  return (
    <ScreenContainer vertical>
      <TopBar>
        {VpsUser.role === AccessLevel.STAFF ? (
          <button className="btn vps">Dashboard</button>
        ) : (
          ""
        )}
      </TopBar>
    </ScreenContainer>
  );
}
