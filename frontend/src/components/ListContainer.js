import React, { useContext, useEffect } from "react";
import ImageList from "@material-ui/core/ImageList";
import ImageListItem from "@material-ui/core/ImageListItem";
import { Box } from "@material-ui/core";
import styles from "../styling/ListContainer.module.scss";
import ScenarioContext from "../context/ScenarioContext";

export default function ListContainer({
  data,
  onItemSelected,
  placeholderText,
  wide,
}) {
  const [selected, setSelected] = useState();
  const columns = wide ? 5 : 4;
  const onItemClick = (item) => {
    setSelected(item.id);
    onItemSelected(item);
  };

  return (
    <>
      <div
        className={
          wide ? styles.scenarioListContainerWide : styles.scenarioListContainer
        }
      >
        {data.length > 0 ? (
          <ImageList rowHeight={210} cols={columns} gap={30}>
            {data.map((item) => (
              <ImageListItem
                key={item.id}
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
                    boxShadow={item.id === scenarioId ? "0 0 5px #008A7B" : ""}
                    height={160}
                    border={5}
                    borderRadius={10}
                    borderColor={item.id === selected ? "#008a7b" : "#747474"}
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
          <p className={styles.text}>{placeholderText || "No Scenarios"}</p>
        )}
      </div>
    </>
  );
}
