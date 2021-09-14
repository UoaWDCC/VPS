import React, { useState } from "react";
import ImageList from "@material-ui/core/ImageList";
import ImageListItem from "@material-ui/core/ImageListItem";
import { Box } from "@material-ui/core";

export default function ImageListContainer({ data, onItemSelected }) {
  const rowHeight = 150;
  const [selected, setSelected] = useState();
  const onItemClick = (item) => {
    setSelected(item._id);
    onItemSelected(item);
  };

  return (
    <>
      <ImageList rowHeight={rowHeight} cols={2} gap={10}>
        {data && data.length > 0
          ? data.map((item) => (
              <ImageListItem
                key={item._id}
                cols={1}
                height={rowHeight}
                onClick={() => onItemClick(item)}
              >
                <Box
                  height={rowHeight}
                  border={item._id === selected ? 5 : 0}
                  borderColor={item._id === selected ? "#008a7b" : "#747474"}
                  overflow="hidden"
                  sx={{
                    "&:hover": {
                      opacity: "0.5",
                    },
                    backgroundImage: `url(${item.url})`,
                    backgroundSize: "cover",
                    boxSizing: "border-box",
                  }}
                />
              </ImageListItem>
            ))
          : null}
      </ImageList>
    </>
  );
}
