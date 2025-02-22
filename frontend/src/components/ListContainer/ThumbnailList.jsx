import { useState } from "react";

import { Box } from "@material-ui/core";
import ImageList from "@material-ui/core/ImageList";
import ImageListItem from "@material-ui/core/ImageListItem";

import Thumbnail from "features/authoring/components/Thumbnail";
import DashedCard from "../DashedCard";

import styles from "./ThumbnailList.module.scss";

/**
 * Component used to display cards in a list format for scenario and scene selection.
 *
 * @component
 * @example
 * const data = [ ... ]
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
 *     onItemSelected={onItemSelected}
 *     onItemDoubleClick={onDoubleClick}
 *     addCard={addCard}
 *     onItemBlur={onItemBlur}
 *   />
 * )
 */
export default function ThumbnailList({
  data, // could be scenarios or scenes data, but expects components.
  invalidNameId,
  highlightOnSelect = true, // Whether or not to highlight the card border on select.
  addCard,
  onItemBlur,
  onItemSelected = () => {},
  onItemDoubleClick = () => {},
}) {
  const [selected, setSelected] = useState();

  /** Function which executes when an image in the image list is clicked. */
  const onItemClick = (event, item) => {
    if (event.detail === 2) {
      onItemDoubleClick(item);
    } else {
      if (highlightOnSelect) {
        setSelected(item._id);
      }
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
      <div className={styles.scenarioListContainer}>
        <ImageList rowHeight={210} gap={30}>
          {addCard ? (
            <ImageListItem
              className="min-w-72 max-w-80 min-h-48"
              key={-1}
              cols={1}
            >
              <DashedCard onClick={addCard} />
            </ImageListItem>
          ) : null}
          {data && data.length > 0
            ? data.map((item) => (
                <ImageListItem
                  className="min-w-72 max-w-80 min-h-48"
                  key={item._id}
                  cols={1}
                  onClick={(event) => onItemClick(event, item)}
                  onContextMenu={() => onItemRightClick(item)}
                >
                  <div className="flex flex-col gap-2">
                    <Box
                      className="cursor-pointer"
                      height={160}
                      border={item._id === selected ? 4 : 2}
                      borderRadius={10}
                      borderColor={
                        item._id === selected ? "#035084" : "#94a3b8 "
                      }
                      overflow="hidden"
                      textAlign="center"
                      display="flex"
                      justifyContent="center"
                      sx={{
                        background: "#e2e8f0",
                        "&:hover": {
                          background: "#035084",
                        },
                      }}
                    >
                      <Thumbnail components={item?.components || []} />
                    </Box>
                    <div className="w-full flex justify-center ">
                      {onItemBlur ? (
                        <input
                          className="w-fit font-mona bg-white border border-slate-300 rounded-lg text-center px-2 py-[0.125rem] max-w-full overflow-ellipsis"
                          defaultValue={item.name}
                          onBlur={onItemBlur}
                          key={item._id}
                        />
                      ) : (
                        <p className="w-fit font-mona bg-slate-200 rounded-full text-center px-4 py-[0.125rem] max-w-full overflow-ellipsis">
                          {item.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {invalidNameId === item._id && (
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
