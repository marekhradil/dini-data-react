export type SerialReceivedDataEntry = { timestamp: Date; value: string };

export type SerialPortInfo = Pick<SerialPort, "getInfo" | "forget">;

export interface SerialReducerState {
  port: SerialPort | null;
  isConnecting: boolean;
  isConnected: boolean;
  isUserCancelled: boolean;
  isSubscribing: boolean;
  buffer: string | null;
  value: number | null;
  error: Error | null;
}

export interface SerialPortState {
  port: SerialPortInfo | null;
  isAvailableSerialApi: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  isUserCancelled: boolean;
  isSubscribing: boolean;
  buffer: string | null;
  value: number | null;
  error: Error | null;
}

export interface SerialPortActions {
  disconnect: () => Promise<void>;
  write: () => Promise<boolean>;
}

export interface UseSerialPortParams {
  options: SerialOptions;
  requestOptions?: SerialPortRequestOptions;
}

export interface UseSerialPortReturn
  extends SerialPortState, SerialPortActions {
  connect: () => Promise<void>;
}

export interface SerialContextValue extends SerialPortState, SerialPortActions {
  connect: (params?: UseSerialPortParams) => Promise<void>;
}
