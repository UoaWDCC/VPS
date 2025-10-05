type ToggleInputProps = React.PropsWithChildren<{
  value: string;
  onToggle: (value: string) => void;
  enabled: string;
  disabled: string;
}>

function ToggleInput({ children, value, onToggle, enabled, disabled }: ToggleInputProps) {
  const active = value === enabled;

  function handleClick() {
    if (active) onToggle(disabled);
    else onToggle(enabled);
  }

  return (
    <li>
      <a className={`${active && "bg-base-100"}`} onClick={handleClick}>
        {children}
      </a>
    </li>
  );
}

export default ToggleInput;
