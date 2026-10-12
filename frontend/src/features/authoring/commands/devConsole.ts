import { commands, toolDefinitions } from "./registry";
import { runBatch, runCommand } from "./run";
import type { Session } from "./types";

// A way to try the commands from the browser console while developing, with
// no model involved:
//
//   await vps.run("add_button", { label: "Continue" })
//   await vps.batch([{ name: "add_shape", args: { shape: "box" } }, ...])
//   vps.commands()
//
// Only installed in development builds.

interface DevConsole {
  run: (name: string, args?: unknown) => ReturnType<typeof runCommand>;
  batch: (
    calls: { name: string; args?: unknown }[]
  ) => ReturnType<typeof runBatch>;
  commands: () => { name: string; kind: string; description: string }[];
  tools: typeof toolDefinitions;
}

declare global {
  interface Window {
    vps?: DevConsole;
  }
}

/** Puts `window.vps` in place; returns a function that takes it away again. */
export function installDevConsole(session: Session) {
  const console_: DevConsole = {
    run: (name, args) => runCommand(session, name, args),
    batch: (calls) => runBatch(session, calls),
    commands: () =>
      commands.map(({ name, kind, description }) => ({
        name,
        kind,
        description,
      })),
    tools: toolDefinitions,
  };

  window.vps = console_;
  return () => {
    if (window.vps === console_) delete window.vps;
  };
}
