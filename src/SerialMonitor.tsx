import { useSerialPort } from "./lib/react-web-serial";

export function SerialMonitor() {
  const {
    isAvailableSerialApi,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    value,
    scaleResponse,
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
          readOnly
          value={value ?? "-"}
          placeholder="(žádná data)"
          className="read-only"
        />
      </div>

      {isConnected && <p className="status">● Čtení aktivní</p>}
      {error && <p className="error">Chyba: {error.message}</p>}
      <div className="row">
        <label>Status:</label>
        <input
          type="text"
          readOnly
          value={scaleResponse ? scaleResponse.status : "-"}
          className="read-only"
        />
      </div>
      <div className="row">
        <label>Tare:</label>
        <input
          type="text"
          readOnly
          value={scaleResponse ? scaleResponse.tare : "-"}
          className="read-only"
        />
      </div>
      <div className="row">
        <label>Weight:</label>
        <input
          type="text"
          readOnly
          value={scaleResponse ? scaleResponse.weight : "-"}
          className="read-only"
        />
      </div>
      <div className="row">
        <label>Unit:</label>
        <input
          type="text"
          readOnly
          value={scaleResponse ? scaleResponse.unit : "-"}
          className="read-only"
        />
      </div>
    </div>
  );
}
