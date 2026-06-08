import ScaleResponseParser from "./scaleResponseParser";
import type { SerialReceivedDataEntry, SerialReducerState } from "./types";

type SerialReducerAction =
  | { type: "CONNECT_START" }
  | { type: "CONNECT_SUCCESS"; port: SerialPort }
  | { type: "CONNECT_CANCEL" }
  | { type: "CONNECT_ABORT" }
  | { type: "CONNECT_ERROR"; error: Error }
  | { type: "DISCONNECT_SUCCESS" }
  | { type: "DISCONNECT_ERROR"; error: Error }
  | { type: "WRITE_ERROR"; error: Error }
  | { type: "SUBSCRIBE_START" }
  | { type: "SUBSCRIBE_FINISH" }
  | { type: "SUBSCRIBE_ERROR"; error: Error }
  | {
      type: "RECEIVE_DATA";
      entry: SerialReceivedDataEntry;
    };

export const initialState: SerialReducerState = {
  port: null,
  isAvailableSerialApi: "serial" in navigator,
  isConnecting: false,
  isConnected: false,
  isSubscribing: false,
  value: null,
  buffer: "",
  error: null,
  scaleResponse: null,
};

export const serialReducer = (
  state: SerialReducerState,
  action: SerialReducerAction,
): SerialReducerState => {
  switch (action.type) {
    case "CONNECT_START":
      return {
        ...state,
        isConnecting: true,
        error: null,
      };
    case "CONNECT_SUCCESS":
      return {
        ...state,
        port: action.port,
        isConnecting: false,
        isConnected: true,
        error: null,
      };
    case "CONNECT_CANCEL":
      return {
        ...state,
        isConnecting: false,
        error: null,
        buffer: "",
        value: null,
      };
    case "CONNECT_ERROR":
      return { ...state, isConnecting: false, error: action.error };
    case "CONNECT_ABORT":
      return {
        ...state,
        port: null,
        isConnecting: false,
        isConnected: false,
        isSubscribing: false,
        error: null,
        buffer: "",
        value: null,
        scaleResponse: null,
      };
    case "DISCONNECT_SUCCESS":
      return {
        ...state,
        port: null,
        isConnected: false,
        isSubscribing: false,
        error: null,
        buffer: "",
        value: null,
        scaleResponse: null,
      };
    case "DISCONNECT_ERROR":
      return {
        ...state,
        port: null,
        isConnected: false,
        isSubscribing: false,
        error: action.error,
        buffer: "",
        value: null,
        scaleResponse: null,
      };
    case "WRITE_ERROR":
      return { ...state, error: action.error };
    case "SUBSCRIBE_START":
      return { ...state, isSubscribing: true, error: null };
    case "SUBSCRIBE_FINISH":
      return {
        ...state,
        isSubscribing: false,
        value: null,
        buffer: "",
        scaleResponse: null,
        error: null,
      };
    case "SUBSCRIBE_ERROR":
      return { ...state, isSubscribing: false, error: action.error };
    case "RECEIVE_DATA": {
      const res = state.buffer + action.entry.value;
      const idx = res.indexOf("\r\n");

      if (idx !== -1) {
        const rawValue = res.substring(0, idx);
        const scaleResponse = ScaleResponseParser(rawValue);
        return {
          ...state,
          value: rawValue,
          buffer: res.substring(idx + 2),
          scaleResponse,
        };
      } else {
        return {
          ...state,
          buffer: res,
        };
      }
    }

    default: {
      const _exhaustive: never = action;
      throw new Error(
        `Unexpected action: ${(_exhaustive as { type: string }).type}`,
      );
    }
  }
};
