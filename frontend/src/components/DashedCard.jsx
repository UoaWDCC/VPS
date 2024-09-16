import { Box } from "@material-ui/core";
import styles from "./ListContainer/ListContainer.module.scss";

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
    <div className={styles.imageListItemWide}>
      <div style={{ position: "relative" }}>
        <Box
          height={160}
          border="5px dashed grey"
          borderRadius={10}
          borderColor="#747474"
          overflow="hidden"
          textAlign="center"
          sx={{
            background: "#f1f1f1",
            "&:hover": {
              background: "#cccccc",
            },
          }}
          onClick={onClick}
        />
        <div className={styles.crossHorizontalLine} />
        <div className={styles.crossVerticalLine} />
      </div>
      <p className={styles.text}>Create New Scene</p>
    </div>
  );
}
