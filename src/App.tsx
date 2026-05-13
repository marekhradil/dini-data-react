import { useState } from "react";
import { SerialProvider } from "./lib/react-web-serial";
import type { SerialReceivedDataEntry } from "./lib/react-web-serial";
import "./App.css";
import { SerialMonitor } from "./SerialMonitor";

export default function App() {
  const [lastRead, setLastRead] = useState("");

  const handleDataRead = (entry: SerialReceivedDataEntry) => {
    setLastRead(entry.value);
  };

  return (
    <SerialProvider onDataRead={handleDataRead}>
      <SerialMonitor lastRead={lastRead} />
    </SerialProvider>
  );
}
