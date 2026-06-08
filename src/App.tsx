import { SerialProvider } from "./lib/react-web-serial";
import { SerialMonitor } from "./SerialMonitor";

export default function App() {
  return (
    <SerialProvider>
      <SerialMonitor />
    </SerialProvider>
  );
}
