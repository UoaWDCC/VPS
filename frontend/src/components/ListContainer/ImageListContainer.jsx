/**
 * Component used to display images in a list format.
 */
export default function ImageListContainer({
  data,
  onItemSelected,
  selectedId,
  horizontal = false,
}) {
  return (
    <div
      className={
        horizontal
          ? "flex gap-2 overflow-x-auto pb-2"
          : "grid grid-cols-4 gap-2"
      }
    >
      {data?.map((item) => (
        <button
          type="button"
          key={item._id}
          onClick={() => onItemSelected(item)}
          className={`${horizontal ? "shrink-0" : ""} ${
            item._id === selectedId ? "border-accent border-2" : ""
          }`}
          style={
            horizontal ? { flexBasis: "calc((100% - 1.5rem) / 4)" } : undefined
          }
        >
          <div
            className="aspect-square bg-cover bg-center hover:opacity-50 hover:cursor-pointer"
            style={{ backgroundImage: `url("${item.url}")` }}
          ></div>
        </button>
      ))}
    </div>
  );
}
