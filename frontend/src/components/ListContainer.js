import React from "react";
import ImageList from "@material-ui/core/ImageList";
import ImageListItem from "@material-ui/core/ImageListItem";
import { Box } from "@material-ui/core";
import styles from "../styling/ListContainer.module.scss";

export default function ListContainer({ data }) {
  return (
    <>
      <div className={styles.scenarioListContainer}>
        {data.length > 0 ? (
          <ImageList rowHeight={200} className={styles.imageList} cols={4}>
            {data.map((item) => (
              <ImageListItem key={item.id} cols={1}>
                <div className={styles.imageListItem}>
                  <Box
                    height={150}
                    border={1}
                    borderRadius={10}
                    overflow="hidden"
                    bgcolor="#008a7b"
                    color="white"
                    textAlign="center"
                  >
                    <img
                      className={styles.itemImage}
                      src={item.img}
                      alt={item.name}
                    />
                  </Box>
                  <p className={styles.text}>{item.name}</p>
                </div>
              </ImageListItem>
            ))}
          </ImageList>
        ) : (
          <p className={styles.text}>No Scenarios</p>
        )}
      </div>
    </>
  );
}
