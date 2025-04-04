const NoteCard = ({ title, role, text, date, onClick }) => {
  return (
    <div
      className="card bg-slate-50 w-60 h-40 shadow-md cursor-pointer border-2 border-slate-50 hover:border-slate-300 "
      onClick={onClick}
    >
      <div className="card-body p-5">
        <h2 className="card-title overflow-hidden text-ellipsis text-nowrap">
          <span className="capitalize">[{role || "-"}]</span>
          <span className="overflow-hidden text-ellipsis">{title || "-"}</span>
        </h2>
        <p className="overflow-hidden text-ellipsis">{text || "-"}</p>
        {/* Date time */}
        <p>
          {`Last edit: ${date ? new Date(date).toLocaleDateString() : "-"}`}
        </p>
      </div>
    </div>
  );
};

export default NoteCard;
