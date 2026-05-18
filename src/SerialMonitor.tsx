import { useState } from "react";
import { useSerialPort } from "./lib/react-web-serial";

export function SerialMonitor() {
  const [sendValue, setSendValue] = useState("");

  const {
    isAvailableSerialApi,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    write,
    receivedData,
  } = useSerialPort({
    options: { baudRate: 9600 },
  });

  if (!isAvailableSerialApi) {
    return (
      <p className="error">
        Web Serial API není v tomto prohlížeči podporováno. Použijte Chrome nebo
        Edge.
      </p>
    );
  }

  const handleSend = async () => {
    if (!sendValue) return;
    await write(sendValue);
  };

  return (
    <div className="monitor">
      <h1>Dini Data – Serial Monitor</h1>

      <div className="row">
        <button
          onClick={() => connect()}
          disabled={isConnected || isConnecting}
        >
          {isConnecting ? "Připojování…" : "Připojit"}
        </button>
        <button onClick={() => disconnect()} disabled={!isConnected}>
          Odpojit
        </button>
      </div>

      <div className="row">
        <input
          type="text"
          placeholder="Data k odeslání…"
          value={sendValue}
          onChange={(e) => setSendValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!isConnected}
        />
        <button onClick={handleSend} disabled={!isConnected || !sendValue}>
          Odeslat
        </button>
      </div>

      <div className="row">
        <label>Poslední přijatý řetězec:</label>
        <input
          type="text"
          readOnly
          value={receivedData.length > 0 ? receivedData[0].value : "-"}
          placeholder="(žádná data)"
          className="read-only"
        />
      </div>

      {isConnected && <p className="status">● Čtení aktivní</p>}
      {error && <p className="error">Chyba: {error.message}</p>}
    </div>
  );
}
