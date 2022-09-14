import React, { useState, useContext } from "react";
import { Button } from "@material-ui/core";
import ScreenContainer from "../../components/ScreenContainer";
import { usePost,} from "../../hooks/crudHooks";
import AuthenticationContext from "../../context/AuthenticationContext";

function DashboardPage() {
  const { getUserIdToken } = useContext(AuthenticationContext);
  // const [dashboardPage, setDashboardPage] = useState([
  //   {
  //     test_data: "workds",
  //   },
  // ]);

  // const userId = "632067145b4bef83c87f2a02";
  // useDelete(`/api/user/${userId}`, getUserIdToken);

  const test = {
    name: "aden",
    uid: "1234",
    email: "yes",
  };

  usePost("/api/user", test, getUserIdToken);

  return (
    <ScreenContainer vertical>
      <Button>TEST</Button>
      <h1>test</h1>
      {/* {dashboardPage.map((page) => (
        <div>
          <h1>{page.test_data}</h1>
        </div>
      ))} */}
    </ScreenContainer>
  );
}

export default DashboardPage;
