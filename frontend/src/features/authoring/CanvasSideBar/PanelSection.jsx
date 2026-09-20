function PanelSection({ name, id, children }) {
  return (
    <section className="text-s mb-3" aria-labelledby={id}>
      <h3 className="mb-3" id={id}>{name}</h3>
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </section>
  )
}

export default PanelSection;
