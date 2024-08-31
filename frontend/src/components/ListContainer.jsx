import { useState } from "react";

import { Box } from "@material-ui/core";
import ImageList from "@material-ui/core/ImageList";
import ImageListItem from "@material-ui/core/ImageListItem";

import Thumbnail from "containers/pages/AuthoringTool/Components/Thumbnail";
import DashedCard from "./DashedCard";

import styles from "../styling/ListContainer.module.scss";
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
 * function onItemDoubleClick() {
 *   console.log("Double clicked.")
 * }
 * function addCard() {
 *   console.log("Card Added.")
 * }
 * function onItemBlur() {
 *   console.log("Item Blurred.")
 * }
 * return (
 *   <ListContainer
 *     data={data}
 *     wide={wide}
 *     sceneSelectionPage={sceneSelectionPage}
 *     scenarioId={scenarioId}
 *     onItemSelected={onItemSelected}
 *     onItemDoubleClick={onDoubleClick}
 *     addCard={addCard}
 *     onItemBlur={onItemBlur}
 *   />
 * )
 */
export default function ListContainer({
  data, // could be scenarios or scenes data
  assignedScenarios,
  onItemSelected,
  onItemDoubleClick,
  wide,
  addCard,
  onItemBlur,
  sceneSelectionPage,
  scenarioId,
  invalidNameId,
}) {
  const classes = useStyles();
  const [selected, setSelected] = useState();
  const columns = wide ? 5 : 4;

  /** Function which executes when an image in the image list is clicked. */
  const onItemClick = (event, item) => {
    if (event.detail === 2) {
      onItemDoubleClick(item);
    } else {
      setSelected(item._id);
      onItemSelected(item);
    }
  };

  /** Function which executes when an image in the image list is right-clicked. Select item. */
  const onItemRightClick = (item) => {
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
        {!sceneSelectionPage && (
          <h1 className="text-3xl font-bold my-3">Created scenarios</h1>
        )}

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
                  onClick={(event) => onItemClick(event, item)}
                  onContextMenu={() => onItemRightClick(item)}
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
                        item._id === selected ? "#035084" : "#747474"
                      }
                      overflow="hidden"
                      textAlign="center"
                      display="flex"
                      sx={{
                        background: "#f1f1f1",
                        "&:hover": {
                          background: "#cccccc",
                        },
                      }}
                    >
                      {sceneSelectionPage ? (
                        <Thumbnail components={item.components} />
                      ) : (
                        <Thumbnail
                          components={item.thumbnail?.components || []}
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
                  {invalidNameId === item._id && (
                    <p1 className="nullNameWarning">invalid null name</p1>
                  )}
                </ImageListItem>
              ))
            : null}
        </ImageList>

        {assignedScenarios ? (
          <>
            {!sceneSelectionPage && (
              <h1 className="text-3xl font-bold my-3">Assigned scenarios</h1>
            )}

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
              {assignedScenarios && assignedScenarios.length > 0
                ? assignedScenarios.map(({ _id, name }) => (
                    <ImageListItem
                      className={classes.listContainerItem}
                      key={_id}
                      cols={1}
                      height={200}
                      onClick={(event) => onItemClick(event, { _id })}
                      onContextMenu={() => onItemRightClick({ _id })}
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
                          borderColor={_id === selected ? "#035084" : "#747474"}
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
                            <Thumbnail url={`/play/${scenarioId}/${_id}`} />
                          ) : (
                            <Thumbnail url={`/play/${_id}`} />
                          )}
                        </Box>
                        <input
                          className={styles.text}
                          defaultValue={name}
                          onBlur={onItemBlur}
                          key={_id}
                        />
                      </div>
                      {invalidNameId === _id && (
                        <p1 className="nullNameWarning">invalid null name</p1>
                      )}
                    </ImageListItem>
                  ))
                : null}
            </ImageList>
          </>
        ) : null}
      </div>
    </>
  );
}
