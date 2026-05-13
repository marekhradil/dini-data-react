import { createContext } from "react";
import type { SerialContextValue } from "./types";

export const SerialContext = createContext<SerialContextValue | undefined>(
	undefined,
);
SerialContext.displayName = "SerialContext";
