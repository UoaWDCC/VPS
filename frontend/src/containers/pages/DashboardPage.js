import React, { useState } from "react";
import { Button } from "@material-ui/core";
import ScreenContainer from "../../components/ScreenContainer";
import { useGet } from "../../hooks/crudHooks";

function DashboardPage() {
  const [dashboardPage, setDashboardPage] = useState([
    {
      test_data: "workds",
    },
  ]);

  useGet("/dashboard", setDashboardPage, false);
  // useEffect(() => {
  //   fetch("/dashboard")
  //     .then((res) => {
  //       if (res.ok) {
  //         return res.json();
  //       }
  //       console.log("idioit");
  //       return dashboardPage;
  //     })
  //     .then((jsonRes) => setDashboardPage(jsonRes));
  // });

  return (
    <ScreenContainer vertical>
      <Button>TEST</Button>
      <h1>test</h1>
      {dashboardPage.map((page) => (
        <div>
          <h1>{page.test_data}</h1>
        </div>
      ))}
    </ScreenContainer>
  );
}

export default DashboardPage;
