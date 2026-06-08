export type SerialReceivedDataEntry = { timestamp: Date; value: string };

export interface SerialReducerState {
  port: SerialPort | null;
  isAvailableSerialApi: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  isSubscribing: boolean;
  value: string | null;
  buffer: string;
  error: Error | null;
  scaleResponse: ScaleRextResponse | null;
}

export interface UseSerialPortParams {
  options: SerialOptions;
  requestOptions?: SerialPortRequestOptions;
}

export interface UseSerialPortReturn extends SerialReducerState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface SerialContextValue extends SerialReducerState {
  connect: (params?: UseSerialPortParams) => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface ScaleRextResponse {
  scale: number;
  status: string;
  weight: number;
  tare: number;
  extra: number;
  unit: string;
}
