/**
 * Component used to display images in a list format.
 */
export default function ImageListContainer({
  data,
  onItemSelected,
  selectedId,
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {data?.map((item) => (
        <button
          type="button"
          key={item.id || item._id} // fallback if some have _id instead
          onClick={() => onItemSelected(item)}
          className={item.id === selectedId ? "border-accent border-2" : ""}
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
