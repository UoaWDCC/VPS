import CloseIcon from "@mui/icons-material/Close";
import { useHistory, useLocation } from "react-router-dom";
import FabMenu from "../../components/FabMenu";
import contributorsByYear from "./contributorsByYear";

const AboutUsPage = () => {
  const history = useHistory();
  const location = useLocation();

  function goBack() {
    if (location.key !== undefined) {
      history.goBack();
    } else {
      history.push("/");
    }
  }

  return (
    <div className="flex h-screen w-screen relative bg-base-100 font-dm font-normal">
      <button
        className="absolute top-8 left-8 bg-transparent border-none p-2 cursor-pointer z-10"
        onClick={goBack}
        aria-label="Close"
      >
        <CloseIcon className="!w-8 !h-8 text-base-content" />
      </button>
      <div className="w-1/2 flex flex-col justify-center items-center bg-base-100">
        <div className="flex flex-col items-start leading-tight text-base-content font-normal text-[5vw] mb-[10vh]">
          <span>Virtual</span>
          <span>Patient</span>
          <span>Simulator</span>
        </div>
      </div>
      <div className="w-1/2 flex flex-col items-start px-12 overflow-y-auto pt-[12vh]">
        {contributorsByYear.map((group, idx) => (
          <div
            key={group.year}
            className={`mb-12 ${idx === 0 ? "mt-[16vh]" : ""} ${idx === contributorsByYear.length - 1 ? "pb-[15vh]" : ""}`}
          >
            <div className="text-2xl mb-4 text-base-content font-normal font-ibm">
              {group.year}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {group.members.map((contributor) => (
                <div
                  key={contributor.login}
                  className="flex flex-row items-center justify-center"
                >
                  <span className="text-sm text-right font-ibm text-primary font-normal mr-6 min-w-[240px]">
                    {getContributionText(contributor.contributions)}
                  </span>
                  <span className="text-m text-left text-base-content font-bold font-ibm min-w-[220px]">
                    {contributor.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <FabMenu />
    </div>
  );
};

function getContributionText(contributions) {
  if (!contributions || !Array.isArray(contributions)) return "";

  if (
    contributions.includes("code") &&
    contributions.includes("projectManagement")
  ) {
    return "Technical Lead";
  }

  return contributions
    .map((contribution) => {
      switch (contribution) {
        case "code":
          return "Software Engineer";
        case "projectManagement":
          return "Project Manager";
        case "design":
          return "Design Lead";
        case "infra":
          return "Infrastructure";
        default:
          return contribution;
      }
    })
    .join("/");
}

export default AboutUsPage;
