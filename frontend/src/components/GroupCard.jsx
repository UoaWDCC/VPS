import { Box } from "@mui/material";

export default function GroupCard({ data, height, onClick }) {
  return (
    <div style={{ position: "relative" }}>
      <Box
        height={height}
        onClick={onClick}
        sx={{
          background: "#f1f5f9",
          "&:hover": {
            background: "#fff",
          },
        }}
        className="cursor-pointer flex flex-col justify-center items-center overflow-hidden rounded-xl border-2 border-slate-400 bg-slate-100 w-[50%]"
      >
        <h3 className="text-1xl font-mona font-bold flex items-center gap-3 b">
          Group {data.users[0].group}
        </h3>
        {data.users.map((user, index) => (
          <li className="list-none" key={index}>
            {user.name}
          </li>
        ))}
        <p>{data._id}</p>
      </Box>
    </div>
  );
}
