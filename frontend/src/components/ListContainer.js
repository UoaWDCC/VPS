import React, { useState } from "react";
import ImageList from "@material-ui/core/ImageList";
import ImageListItem from "@material-ui/core/ImageListItem";
import { Box } from "@material-ui/core";
import styles from "../styling/ListContainer.module.scss";
import DashedCard from "./DashedCard";
import useStyles from "./component.styles";

export default function ListContainer({ data, onItemSelected, wide, addCard }) {
  const classes = useStyles();
  const [selected, setSelected] = useState();
  const columns = wide ? 5 : 4;
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
                    />
                    <input className={styles.text} defaultValue={item.name} />
                  </div>
                </ImageListItem>
              ))
            : null}
        </ImageList>
      </div>
    </>
  );
}
