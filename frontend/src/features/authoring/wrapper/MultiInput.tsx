type MultiInputProps = React.PropsWithChildren<{
  value: string;
  onChange: (value: string) => void;
  options: string[]
}>

function MultiInput({
  children,
  value,
  onChange,
  options,
}: MultiInputProps) {
  return (
    <>
      {options.map((option, i) => (
        <button key={i}
          className={`button ${value === option && "active"}`}
          onClick={() => onChange(option)}
        >
          {/* @ts-ignore */}
          {children[i]}
        </button>
      ))}
    </>
  );
}

export default MultiInput;
