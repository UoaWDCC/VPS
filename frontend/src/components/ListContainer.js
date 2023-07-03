import React, { useState } from "react";
import ImageList from "@material-ui/core/ImageList";
import ImageListItem from "@material-ui/core/ImageListItem";
import { Box } from "@material-ui/core";
import Thumbnail from "./Thumbnail";
import styles from "../styling/ListContainer.module.scss";
import DashedCard from "./DashedCard";
import useStyles from "./component.styles";

/**
 * Component used to display cards in a list format for scenario and scene selection.
 *
 * @component
 * @example
 * const data = [ ... ]
 * const wide = true
 * const sceneSelectionPage = false
 * const scenarioId = "1ef4cD1wsd676dS"
 * function onItemSelected() {
 *   console.log("Selected.")
 * }
 * function addCard() {
 *   console.log("Card Added.")
 * }
 * function onItemBlur() {
 *   console.log("Item Blurred."")
 * }
 * return (
 *   <ListContainer
 *     data={data}
 *     wide={wide}
 *     sceneSelectionPage={sceneSelectionPage}
 *     scenarioId={scenarioId}
 *     onItemSelected={onItemSelected}
 *     addCard={addCard}
 *     onItemBlur={onItemBlur}
 *   />
 * )
 */
export default function ListContainer({
  data,
  onItemSelected,
  wide,
  addCard,
  onItemBlur,
  sceneSelectionPage,
  scenarioId,
  invalidName,
}) {
  const classes = useStyles();
  const [selected, setSelected] = useState();
  const columns = wide ? 5 : 4;

  /** Function which executes when an image in the image list is clicked. */
  const onItemClick = (item) => {
    setSelected(item._id);
    onItemSelected(item);
  };

  return (
    <>
      <div
        className={
          wide ? styles.scenarioListContainerWide : styles.scenarioListContainer
        }
      >
        <ImageList rowHeight={210} cols={columns} gap={30}>
          {addCard ? (
            <ImageListItem
              className={classes.listContainerItem}
              key={-1}
              cols={1}
              height={200}
            >
              <DashedCard onClick={addCard} />
            </ImageListItem>
          ) : null}
          {data && data.length > 0
            ? data.map((item) => (
                <ImageListItem
                  className={classes.listContainerItem}
                  key={item._id}
                  cols={1}
                  height={200}
                  onClick={() => onItemClick(item)}
                >
                  <div
                    className={
                      wide ? styles.imageListItemWide : styles.imageListItem
                    }
                  >
                    <Box
                      height={160}
                      border={5}
                      borderRadius={10}
                      borderColor={
                        item._id === selected ? "#008a7b" : "#747474"
                      }
                      overflow="hidden"
                      textAlign="center"
                      sx={{
                        background: "#f1f1f1",
                        "&:hover": {
                          background: "#cccccc",
                        },
                      }}
                    >
                      {sceneSelectionPage ? (
                        <Thumbnail
                          url={`${process.env.PUBLIC_URL}/play/${scenarioId}/${item._id}`}
                        />
                      ) : (
                        <Thumbnail
                          url={`${process.env.PUBLIC_URL}/play/${item._id}`}
                        />
                      )}
                    </Box>
                    <input
                      className={styles.text}
                      defaultValue={item.name}
                      onBlur={onItemBlur}
                      key={item._id}
                    />
                  </div>
                  {invalidName && (
                    <p1 className="nullNameWarning">invalid null name</p1>
                  )}
                </ImageListItem>
              ))
            : null}
        </ImageList>
      </div>
    </>
  );
}
