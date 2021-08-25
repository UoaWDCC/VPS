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
          <ImageList rowHeight={210} cols={4} gap={30}>
            {data.map((item) => (
              <ImageListItem key={item.id} cols={1} height={200}>
                <div className={styles.imageListItem}>
                  <Box
                    height={160}
                    border={1}
                    borderRadius={10}
                    borderColor="#747474"
                    overflow="hidden"
                    bgcolor="#f1f1f1"
                    textAlign="center"
                  />
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
