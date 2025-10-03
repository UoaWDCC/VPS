import { useHistory } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const AboutUsPage = () => {
  const history = useHistory();
  return (
    <div className="flex h-screen w-screen overflow-x-hidden">
      <div className="flex-1 p-8 overflow-y-auto bg-black relative">
        <div className="flex items-center w-full mb-8 justify-between">
          <button
            className="bg-white text-black px-4 py-2 rounded hover:bg-grey font-mono transition-all border border-gray-300 flex items-center gap-2"
            onClick={() => history.goBack()}
          >
            <ArrowBackIcon fontSize="small" />
            Back
          </button>
          <h1 className="text-3xl font-bold font-mono text-center flex-1 text-center">
            About Us
          </h1>
          <div className="invisible">
            <button className="px-4 py-2 rounded border border-gray-300 flex items-center gap-2">
              <ArrowBackIcon fontSize="small" />
              Back
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {contributors.map((contributor) => (
            <div
              key={contributor.login}
              className="rounded-lg p-4 flex flex-col items-center transition-all hover:shadow-lg hover:translate-y-[-5px] border border-gray-100 bg-white text-black hover:bg-grey hover:text-white"
            >
              <img
                src={contributor.avatar_url}
                alt={contributor.name}
                className="rounded-full w-24 h-24 object-cover mb-4 border-2"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/uoa-logo.png";
                }}
              />
              <h4 className="font-bold text-lg font-mono text-black">
                {contributor.name}
              </h4>
              <p className="text-sm mb-2 font-dm text-gray-600">
                {getContributionText(contributor.contributions)}
              </p>
              <a
                href={contributor.profile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline font-ibm text-black"
              >
                @{contributor.login}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getContributionText(contributions) {
  if (!contributions || !Array.isArray(contributions)) return "";

  return contributions
    .map((contribution) => {
      switch (contribution) {
        case "code":
          return "Developer";
        case "projectManagement":
          return "Project Manager";
        case "design":
          return "Designer";
        case "infra":
          return "Infrastructure";
        default:
          return contribution;
      }
    })
    .join(", ");
}

const contributors = [
  {
    login: "lucas2005gao",
    name: "Lucas Gao",
    avatar_url: "https://avatars.githubusercontent.com/u/48196609?v=4",
    profile: "https://github.com/lucas2005gao",
    contributions: ["code"],
  },
  {
    login: "flexzy",
    name: "Felix Yang",
    avatar_url: "https://avatars.githubusercontent.com/u/49087744?v=4",
    profile: "https://github.com/flexzy",
    contributions: ["code"],
  },
  {
    login: "David-Xia0",
    name: "David Xiao",
    avatar_url: "https://avatars.githubusercontent.com/u/50573329?v=4",
    profile: "https://github.com/David-Xia0",
    contributions: ["code"],
  },
  {
    login: "zyan225",
    name: "zyan225",
    avatar_url: "https://avatars.githubusercontent.com/u/52368549?v=4",
    profile: "https://github.com/zyan225",
    contributions: ["code"],
  },
  {
    login: "dongmeilim",
    name: "Dong Mei Lim",
    avatar_url: "https://avatars.githubusercontent.com/u/52555301?v=4",
    profile: "https://github.com/dongmeilim",
    contributions: ["code"],
  },
  {
    login: "annithinggoes",
    name: "annithinggoes",
    avatar_url: "https://avatars.githubusercontent.com/u/52563454?v=4",
    profile: "https://github.com/annithinggoes",
    contributions: ["code"],
  },
  {
    login: "afei088",
    name: "Andrew Fei",
    avatar_url: "https://avatars.githubusercontent.com/u/60560589?v=4",
    profile: "https://github.com/afei088",
    contributions: ["code"],
  },
  {
    login: "wjin-lee",
    name: "Woo Jin Lee",
    avatar_url: "https://avatars.githubusercontent.com/u/100455176?v=4",
    profile: "https://github.com/wjin-lee",
    contributions: ["code", "projectManagement"],
  },
  {
    login: "JordanBlenn",
    name: "Jordan",
    avatar_url: "https://avatars.githubusercontent.com/u/127293604?v=4",
    profile: "https://github.com/JordanBlenn",
    contributions: ["projectManagement"],
  },
  {
    login: "harbassan",
    name: "Hartej Bassan",
    avatar_url: "https://avatars.githubusercontent.com/u/84175605?v=4",
    profile: "https://github.com/harbassan",
    contributions: ["code", "projectManagement"],
  },
  {
    login: "itsatulbox",
    name: "itsatulbox",
    avatar_url: "https://avatars.githubusercontent.com/u/161205868?v=4",
    profile: "https://github.com/itsatulbox",
    contributions: ["code"],
  },
  {
    login: "laibatool792",
    name: "laibatool792",
    avatar_url: "https://avatars.githubusercontent.com/u/133545972?v=4",
    profile: "https://github.com/laibatool792",
    contributions: ["code"],
  },
  {
    login: "sbeen56",
    name: "sbeen56",
    avatar_url: "https://avatars.githubusercontent.com/u/161543207?v=4",
    profile: "https://github.com/sbeen56",
    contributions: ["code"],
  },
  {
    login: "Kot6603",
    name: "Koutaro Yumiba",
    avatar_url: "https://avatars.githubusercontent.com/u/89110272?v=4",
    profile: "https://github.com/Kot6603",
    contributions: ["code"],
  },
  {
    login: "xche529",
    name: "Tommy Chen",
    avatar_url: "https://avatars.githubusercontent.com/u/126313171?v=4",
    profile: "https://github.com/xche529",
    contributions: ["code"],
  },
  {
    login: "codecreator127",
    name: "John Lin",
    avatar_url: "https://avatars.githubusercontent.com/u/120153300?v=4",
    profile: "https://github.com/codecreator127",
    contributions: ["code"],
  },
  {
    login: "jacobmathew105",
    name: "jacobmathew105",
    avatar_url: "https://avatars.githubusercontent.com/u/136278107?v=4",
    profile: "https://github.com/jacobmathew105",
    contributions: ["code"],
  },
  {
    login: "Ryuna001",
    name: "Ryuna001",
    avatar_url: "https://avatars.githubusercontent.com/u/127585171?v=4",
    profile: "https://github.com/Ryuna001",
    contributions: ["projectManagement"],
  },
  {
    login: "djos192",
    name: "Dhruv Joshi",
    avatar_url: "https://avatars.githubusercontent.com/u/100509811?v=4",
    profile: "https://github.com/djos192",
    contributions: ["projectManagement"],
  },
  {
    login: "John-Moore-UOA",
    name: "John Moore",
    avatar_url: "https://avatars.githubusercontent.com/u/126381092?v=4",
    profile: "https://john-moore-uoa.github.io/Profile-Website/",
    contributions: ["code"],
  },
  {
    login: "j-enn-y",
    name: "j-enn-y",
    avatar_url: "https://avatars.githubusercontent.com/u/127184310?v=4",
    profile: "https://github.com/j-enn-y",
    contributions: ["code"],
  },
  {
    login: "GodYazza",
    name: "Yang Qian",
    avatar_url: "https://avatars.githubusercontent.com/u/30404287?v=4",
    profile: "https://github.com/GodYazza",
    contributions: ["code"],
  },
  {
    login: "quirked-up",
    name: "Lilith",
    avatar_url: "https://avatars.githubusercontent.com/u/115190871?v=4",
    profile: "https://github.com/quirked-up",
    contributions: ["code"],
  },
  {
    login: "arnard76",
    name: "Arnav",
    avatar_url: "https://avatars.githubusercontent.com/u/78939786?v=4",
    profile: "https://grow-run-archive.vercel.app/welcome",
    contributions: ["code"],
  },
  {
    login: "nicholas-kondal",
    name: "Nicholas Kondal",
    avatar_url: "https://avatars.githubusercontent.com/u/49134354?v=4",
    profile: "https://www.nicholaskondal.com/",
    contributions: ["code", "projectManagement"],
  },
  {
    login: "Harshal-D",
    name: "Harshal-D",
    avatar_url: "https://avatars.githubusercontent.com/u/41532279?v=4",
    profile: "https://github.com/Harshal-D",
    contributions: ["projectManagement"],
  },
  {
    login: "DamonGreenhalgh",
    name: "Damon Greenhalgh",
    avatar_url: "https://avatars.githubusercontent.com/u/59471444?v=4",
    profile: "https://www.damongreenhalgh.com/",
    contributions: ["code"],
  },
  {
    login: "aadenmann",
    name: "Aden Ing",
    avatar_url: "https://avatars.githubusercontent.com/u/101456326?v=4",
    profile: "https://github.com/aadenmann",
    contributions: ["code"],
  },
  {
    login: "KW781",
    name: "Aarnob Guha",
    avatar_url: "https://avatars.githubusercontent.com/u/59013794?v=4",
    profile: "https://github.com/KW781",
    contributions: ["code"],
  },
  {
    login: "lia-arroyo",
    name: "Lia Arroyo",
    avatar_url: "https://avatars.githubusercontent.com/u/94775011?v=4",
    profile: "https://github.com/lia-arroyo",
    contributions: ["code"],
  },
  {
    login: "retinfai",
    name: "Afereti Pama",
    avatar_url: "https://avatars.githubusercontent.com/u/79831813?v=4",
    profile: "https://github.com/retinfai",
    contributions: ["code"],
  },
  {
    login: "aing810",
    name: "aing810",
    avatar_url: "https://avatars.githubusercontent.com/u/79810932?v=4",
    profile: "https://github.com/aing810",
    contributions: ["code"],
  },
  {
    login: "jfen445",
    name: "jfen445",
    avatar_url: "https://avatars.githubusercontent.com/u/79815130?v=4",
    profile: "https://github.com/jfen445",
    contributions: ["code"],
  },
  {
    login: "mlai962",
    name: "Matthew Lai",
    avatar_url: "https://avatars.githubusercontent.com/u/79812370?v=4",
    profile: "https://github.com/mlai962",
    contributions: ["code"],
  },
  {
    login: "nroh555",
    name: "Naren Rohan",
    avatar_url: "https://avatars.githubusercontent.com/u/100507962?v=4",
    profile: "https://github.com/nroh555",
    contributions: ["infra"],
  },
  {
    login: "Ray-F",
    name: "Raymond Feng",
    avatar_url: "https://avatars.githubusercontent.com/u/19633284?v=4",
    profile: "https://github.com/Ray-F",
    contributions: ["infra"],
  },
  {
    login: "kelvinchen8",
    name: "kelvinchen8",
    avatar_url: "https://avatars.githubusercontent.com/u/161402193?v=4",
    profile: "https://github.com/kelvinchen8",
    contributions: ["code"],
  },
  {
    login: "oorjagandhi",
    name: "Oorja Gandhi",
    avatar_url: "https://avatars.githubusercontent.com/u/72714597?v=4",
    profile: "https://github.com/oorjagandhi",
    contributions: ["code"],
  },
  {
    login: "Richman-Tan",
    name: "rtan654",
    avatar_url: "https://avatars.githubusercontent.com/u/160602954?v=4",
    profile: "https://github.com/Richman-Tan",
    contributions: ["code"],
  },
  {
    login: "RLee64",
    name: "Rayen Lee",
    avatar_url: "https://avatars.githubusercontent.com/u/159082701?v=4",
    profile: "https://github.com/RLee64",
    contributions: ["code"],
  },
  {
    login: "becky-n",
    name: "Becky Ngan",
    avatar_url: "https://avatars.githubusercontent.com/u/51529481?v=4",
    profile: "https://github.com/becky-n",
    contributions: ["projectManagement"],
  },
  {
    login: "hazikchaudhry",
    name: "Hazik Chaudhry",
    avatar_url: "https://avatars.githubusercontent.com/u/99319319?v=4",
    profile: "https://github.com/hazikchaudhry",
    contributions: ["code", "design"],
  },
  {
    login: "mshi672",
    name: "mshi672",
    avatar_url: "https://avatars.githubusercontent.com/u/162376891?v=4",
    profile: "https://github.com/mshi672",
    contributions: ["code", "design"],
  },
  {
    login: "IceBear-2000",
    name: "IceBear-2000",
    avatar_url: "https://avatars.githubusercontent.com/u/160542881?v=4",
    profile: "https://github.com/IceBear-2000",
    contributions: ["code", "design"],
  },
  {
    login: "R4H3N",
    name: "Rohan Dhingra",
    avatar_url: "https://avatars.githubusercontent.com/u/126861359?v=4",
    profile: "https://github.com/R4H3N",
    contributions: ["code"],
  },
];

export default AboutUsPage;
