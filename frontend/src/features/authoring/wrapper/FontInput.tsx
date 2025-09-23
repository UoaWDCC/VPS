function FontInput({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        list="fonts"
        className="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="text"
      />
      <datalist id="fonts">
        <option value="Arial" />
        <option value="Verdana" />
        <option value="Tahoma" />
        <option value="Trebuchet MS" />
        <option value="Times New Roman" />
        <option value="Georgia" />
        <option value="Garamond" />
        <option value="Courier New" />
        <option value="Helvetica" />
      </datalist>
    </div>
  );
}

export default FontInput;
