import { ThemeProvider } from "@material-ui/core";
import "normalize.css";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import AuthenticationContextProvider from "../context/AuthenticationContextProvider";
import ScenarioContextProvider from "../context/ScenarioContextProvider";
import SceneContextProvider from "../context/SceneContextProvider";
import AccessLevel from "../enums/route.access.level";
import ProtectedRoute from "../firebase/ProtectedRoute";
import "../styling/style.scss";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ManageGroupsPage from "./pages/ManageGroups/ManageGroupsPage";
import PlayScenarioResolver from "./pages/PlayScenarioPage/PlayScenarioResolver";
import ScenarioSelectionPage from "./pages/ScenarioSelectionPage";
import { ScenePage } from "./pages/SceneSelectionPage";
import theme from "./theme/App.theme";

export default function App() {
  return (
    <div className="bg-blue-500 text-white text-center p-10">
      <h1 className="text-4xl font-bold">Tailwind CSS is working!</h1>
      <p className="mt-4">This is a test of Tailwind CSS.</p>
    </div>
  );
}
