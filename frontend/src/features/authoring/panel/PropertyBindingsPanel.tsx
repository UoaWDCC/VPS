import { useState } from "react";
import PanelSection from "./PanelSection";
import PropertyBinding from "../../../components/Properties/PropertyBinding";
import CreatePropertyBinding from "../../../components/Properties/CreatePropertyBinding";
import type { Component } from "../types";

interface PropertyBindingsPanelProps {
  component: Component | null;
}

export default function PropertyBindingsPanel({
  component,
}: PropertyBindingsPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const bindings = component?.stateBindings ?? [];

  return (
    <>
      <PanelSection
        name="Direct Bindings"
        id="direct-bindings"
        onAdd={() => setCreateOpen(true)}
      >
        {bindings.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {bindings.map((binding, index) => (
              <PropertyBinding
                component={component}
                binding={binding}
                key={`${binding.target}-${binding.stateVariableId}-${index}`}
              />
            ))}
          </ul>
        ) : (
          <p className="text-xs text-primary">
            No direct bindings yet for this scene
          </p>
        )}
      </PanelSection>
      <PanelSection
        name="Conditional Bindings"
        id="conditional-bindings"
        onAdd={console.log}
      >
        <p className="text-xs text-primary">
          No conditional bindings yet for this scene
        </p>
      </PanelSection>
      <CreatePropertyBinding
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
}
