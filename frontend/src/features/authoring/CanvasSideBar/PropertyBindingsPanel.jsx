import { useState } from "react";
import PanelSection from "./PanelSection";
import PropertyBinding from "../../../components/Properties/PropertyBinding";
import CreatePropertyBinding from "../../../components/Properties/CreatePropertyBinding";

export default function PropertyBindingsPanel({ component }) {
  const [createOpen, setCreateOpen] = useState(false);
  const bindings = component?.stateBindings ?? [];

  return (
    <>
      <PanelSection
        name="Direct Bindings"
        id="direct-bindings"
        onAdd={() => setCreateOpen(true)}
      >
        {bindings.length === 0 && (
          <p className="text-xs opacity-70">No direct bindings yet</p>
        )}
        <ul className="flex flex-col gap-1">
          {bindings.map((binding, index) => (
            <PropertyBinding
              component={component}
              binding={binding}
              key={`${binding.target}-${binding.stateVariableId}-${index}`}
            />
          ))}
        </ul>
      </PanelSection>
      <PanelSection
        name="Conditional Bindings"
        id="conditional-bindings"
        onAdd={console.log}
      ></PanelSection>
      <CreatePropertyBinding
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
}
