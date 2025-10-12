function FontInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <input
        type="text"
        className="input input-sm h-[28px] w-30"
        placeholder="Font Name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list="fonts"
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
    </>
  );
}

export default FontInput;
