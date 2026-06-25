function Chip({ text, struck = false, onAction, Icon }) {
  return (
    <div className="badge badge-accent">
      <span className={struck ? "line-through" : ""}>{text}</span>
      <button type="button" className="cursor-pointer" onClick={onAction}>
        <Icon size={16} />
      </button>
    </div>
  );
}

export default Chip;
