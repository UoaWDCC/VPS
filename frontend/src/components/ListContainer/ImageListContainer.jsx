import { Box } from "@material-ui/core";
import ImageList from "@material-ui/core/ImageList";
import ImageListItem from "@material-ui/core/ImageListItem";

/**
 * Component used to display images in a list format.
 */
export default function ImageListContainer({ data, onItemSelected, selectedId }) {
  const rowHeight = 150;

  const onItemClick = (item) => {
    onItemSelected(item);
  };

  return (
    <ImageList rowHeight={rowHeight} cols={2} gap={10}>
      {data?.map((item) => (
        <ImageListItem
          key={item.id || item._id} // fallback if some have _id instead
          cols={1}
          onClick={() => onItemClick(item)}
        >
          <Box
            height={rowHeight}
            minWidth={rowHeight}
            border={item.id === selectedId ? 5 : 0}
            borderColor={item.id === selectedId ? "#00b0e6" : "#747474"}
            overflow="hidden"
            sx={{
              "&:hover": {
                opacity: "0.5",
                cursor: "pointer",
              },
              backgroundImage: `url(${item.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxSizing: "border-box",
            }}
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}
