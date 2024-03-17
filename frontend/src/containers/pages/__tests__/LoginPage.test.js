import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthenticationContextProvider from "../../../context/AuthenticationContextProvider";
import LoginPage from "../LoginPage";

test("Login page snapshot test", () => {
  const { baseElement } = render(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <LoginPage />
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
