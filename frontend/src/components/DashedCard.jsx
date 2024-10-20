import { Box } from "@material-ui/core";

import AddRoundedIcon from "@mui/icons-material/AddRounded";

/**
 * Component used to represent a card with a dashed border, used to indicate that a new card can be created.
 *
 * @component
 * @example
 * function onClick() {
 *   console.log("Clicked")
 * }
 *
 * return (
 *   <DashedCard onClick={onClick} />
 * )
 */
export default function DashedCard({ onClick }) {
  return (
    <div>
      <div style={{ position: "relative" }}>
        <Box
          height={160}
          onClick={onClick}
          sx={{
            background: "#f1f5f9",
            "&:hover": {
              background: "#fff",
            },
          }}
          className="cursor-pointer flex justify-center items-center overflow-hidden rounded-xl border-2 border-dashed border-slate-400 bg-slate-100"
        >
          <AddRoundedIcon
            className="text-slate-500"
            sx={{
              fontSize: "5rem",
            }}
          />
        </Box>
      </div>
    </div>
  );
}
