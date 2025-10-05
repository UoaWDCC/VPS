interface SelectInputProps {
    values: string[];
    value: string | null;
    display?: (v: SelectInputProps["value"]) => string;
    onChange: (v: SelectInputProps["value"]) => void;
    nullable?: boolean;
}

function SelectInput(
    { values, value, display, nullable = false, onChange, ...props }: SelectInputProps) {

    const render = display ? display : (v: string) => v;

    function handleClick(v: typeof value) {
        (document.activeElement as HTMLDivElement).blur();
        onChange(v);
    }

    return (
        <div className="dropdown flex-1" {...props} >
            <div tabIndex={0} role="button" className="justify-start input mb-1 font-normal join-item w-full">
                {value ? render(value) : "None"}
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-300 rounded-box z-1 w-52 p-2 shadow-sm">
                {values.map((v: string, i: number) => (
                    <li key={i}>
                        <a onClick={() => handleClick(v)}>
                            {render(v)}
                        </a>
                    </li>
                ))}
                {nullable ? (
                    <li><a onClick={() => onChange(null)}>None</a></li>
                ) : null}
            </ul>
        </div>
    )
}

export default SelectInput;
