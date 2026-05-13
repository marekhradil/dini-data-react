export type SerialReceivedDataEntry = { timestamp: Date; value: string };

export interface StartSubscribeOptions {
  maxReceivedDataCount?: number;
}

export type SerialPortInfo = Pick<SerialPort, "getInfo" | "forget">;

export interface SerialReducerState {
  port: SerialPort | null;
  isConnecting: boolean;
  isConnected: boolean;
  isUserCancelled: boolean;
  isSubscribing: boolean;
  receivedData: SerialReceivedDataEntry[];
  error: Error | null;
}

export interface SerialPortState {
  port: SerialPortInfo | null;
  isAvailableSerialApi: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  isUserCancelled: boolean;
  isSubscribing: boolean;
  receivedData: SerialReceivedDataEntry[];
  error: Error | null;
}

export interface SerialPortActions {
  disconnect: () => Promise<void>;
  write: (data: string) => Promise<boolean>;
  startSubscribe: (options?: StartSubscribeOptions) => void;
  stopSubscribe: () => Promise<void>;
  clearReceivedData: () => void;
}

export interface UseSerialPortParams {
  options: SerialOptions;
  requestOptions?: SerialPortRequestOptions;
  maxReceivedDataCount?: number;
}

export interface UseSerialPortReturn
  extends SerialPortState, SerialPortActions {
  connect: () => Promise<void>;
}

export interface SerialContextValue extends SerialPortState, SerialPortActions {
  connect: (params?: UseSerialPortParams) => Promise<void>;
}
