import { Minus, Plus } from "lucide-react";

function NumberInput({ value, onChange, step = 1 }: { value: number, onChange: (value: number) => void, step?: number }) {
  function increment() {
    onChange(value + step);
  }

  function decrement() {
    onChange(value - step);
  }

  return (
    <div className="join">
      <button className="btn btn-xs h-[28px] join-item bg-base-100 shadow-none border-none" onClick={increment}>
        <Plus size={14} />
      </button>
      <input
        className="input input-sm h-[28px] join-item w-10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        type="number"
        min={1}
        max={100}
      />
      <button className="btn btn-xs h-[28px] join-item bg-base-100 shadow-none border-none" onClick={decrement}>
        <Minus size={14} />
      </button>
    </div>
  );
}

export default NumberInput;
