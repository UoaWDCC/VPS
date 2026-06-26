function Chip({ text, struck = false, onAction, Icon, actionLabel }) {
  return (
    <div className="badge badge-accent">
      <span className={struck ? "line-through" : ""}>{text}</span>
      <button
        type="button"
        className="cursor-pointer"
        onClick={onAction}
        aria-label={actionLabel}
      >
        <Icon size={16} />
      </button>
    </div>
  );
}

export default Chip;
