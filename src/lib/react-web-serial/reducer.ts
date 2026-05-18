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
  isConnecting: false,
  isConnected: false,
  isUserCancelled: false,
  //isSubscribing: false,
  buffer: null,
  value: null,
  error: null,
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
        isUserCancelled: false,
        error: null,
      };
    case "CONNECT_SUCCESS":
      return {
        ...state,
        port: action.port,
        isConnecting: false,
        isConnected: true,
        isUserCancelled: false,
        error: null,
      };
    case "CONNECT_CANCEL":
      return {
        ...state,
        isConnecting: false,
        isUserCancelled: true,
        error: null,
      };
    case "CONNECT_ERROR":
      return { ...state, isConnecting: false, error: action.error };
    case "CONNECT_ABORT":
      return {
        ...state,
        port: null,
        isConnecting: false,
        isConnected: false,
        isUserCancelled: false,
        //isSubscribing: false,
        error: null,
      };
    case "DISCONNECT_SUCCESS":
      return {
        ...state,
        port: null,
        isConnected: false,
        //isSubscribing: false,
        error: null,
      };
    case "DISCONNECT_ERROR":
      return {
        ...state,
        port: null,
        isConnected: false,
        //isSubscribing: false,
        error: action.error,
      };
    case "WRITE_ERROR":
      return { ...state, error: action.error };
    case "SUBSCRIBE_START":
      return { ...state, error: null };
    case "SUBSCRIBE_FINISH":
      return { ...state };
    case "SUBSCRIBE_ERROR":
      return { ...state, error: action.error };
    case "RECEIVE_DATA": {
      //const { receivedData } = state;
      //const max = action.maxReceivedDataCount;
      // const start =
      //   receivedData.length + 1 > max ? receivedData.length + 1 - max : 0;
      return {
        ...state,
        buffer: action.entry.value,
      };
    }

    default: {
      const _exhaustive: never = action;
      throw new Error(
        `Unexpected action: ${(_exhaustive as { type: string }).type}`,
      );
    }
  }
};
