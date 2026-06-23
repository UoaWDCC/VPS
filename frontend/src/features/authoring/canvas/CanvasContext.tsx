import { createContext } from "react";

const CanvasContext = createContext<Record<string, unknown>>({});

export default CanvasContext;
