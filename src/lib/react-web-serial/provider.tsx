import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { SerialContext } from "./context";
import { initialState, serialReducer } from "./reducer";
import type {
  SerialPortInfo,
  SerialReceivedDataEntry,
  UseSerialPortParams,
} from "./types";

export interface SerialProviderProps {
  children: React.ReactNode;
}

const textEncoder = new TextEncoder();
const decoder = new TextDecoder();

export const SerialProvider = ({ children }: SerialProviderProps) => {
  const isAvailableSerialApi = "serial" in navigator;
  const [state, dispatch] = useReducer(serialReducer, initialState);

  const connectingAbortControllerRef = useRef<AbortController | null>(null);
  const subscribeAbortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );
  const readLoopDoneRef = useRef<Promise<void> | null>(null);
  const writeQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));

  useEffect(() => {
    return () => {
      if (connectingAbortControllerRef.current) {
        connectingAbortControllerRef.current.abort();
        connectingAbortControllerRef.current = null;
      }
      // if (subscribeAbortControllerRef.current) {
      //   subscribeAbortControllerRef.current.abort();
      //   subscribeAbortControllerRef.current = null;
      // }
      // if (readerRef.current) {
      //   readerRef.current.cancel().catch(() => {});
      //   readerRef.current = null;
      // }
      state.port?.close().catch(() => {});
      readLoopDoneRef.current = null;
      writeQueueRef.current = Promise.resolve(true);
    };
  }, [state.port]);

  const readingLoop = async (
    signal: AbortSignal,
    reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>,
  ) => {
    try {
      while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;

        if (value !== undefined) {
          const entry: SerialReceivedDataEntry = {
            timestamp: new Date(),
            value: decoder.decode(value, { stream: true }),
          };

          dispatch({
            type: "RECEIVE_DATA",
            entry,
          });
        }
      }
    } catch (err) {
      if (!signal.aborted) {
        const error =
          err instanceof Error ? err : new Error("Failed to read data");
        dispatch({ type: "SUBSCRIBE_ERROR", error });
      }
    } finally {
      const remaining = decoder.decode();
      if (remaining) {
        const entry: SerialReceivedDataEntry = {
          timestamp: new Date(),
          value: remaining,
        };
        dispatch({
          type: "RECEIVE_DATA",
          entry,
        });
      }
      reader.releaseLock();
      subscribeAbortControllerRef.current = null;
      readerRef.current = null;
      readLoopDoneRef.current = null;
      dispatch({ type: "SUBSCRIBE_FINISH" });
    }
  };

  const connect = useCallback(
    async (params?: UseSerialPortParams) => {
      if (connectingAbortControllerRef.current || state.port) return;

      const options = params?.options;
      const requestOptions = params?.requestOptions;

      if (!options) {
        dispatch({
          type: "CONNECT_ERROR",
          error: new Error("SerialOptions are required: pass to connect()"),
        });
        return;
      }

      const abortController = new AbortController();
      connectingAbortControllerRef.current = abortController;
      dispatch({ type: "CONNECT_START" });

      try {
        const requestedPort =
          await navigator.serial.requestPort(requestOptions);
        await requestedPort.open(options);

        if (abortController.signal.aborted) {
          try {
            await requestedPort.close();
          } catch {
            // ignore close errors on abort
          }
          return;
        }

        dispatch({ type: "CONNECT_SUCCESS", port: requestedPort });
        connectingAbortControllerRef.current = null;

        if (!requestedPort || !requestedPort.readable) {
          dispatch({
            type: "SUBSCRIBE_ERROR",
            error: new Error("Port is not connected or not readable"),
          });

          return;
        }

        const subscribeAbortController = new AbortController();
        subscribeAbortControllerRef.current = subscribeAbortController;
        const signal = subscribeAbortController.signal;

        let reader: ReadableStreamDefaultReader<Uint8Array>;
        try {
          reader = requestedPort.readable.getReader();
        } catch (err) {
          subscribeAbortControllerRef.current = null;
          const error =
            err instanceof Error ? err : new Error("Failed to start subscribe");
          dispatch({ type: "SUBSCRIBE_ERROR", error });
          return;
        }

        readerRef.current = reader;
        dispatch({ type: "SUBSCRIBE_START" });

        readLoopDoneRef.current = (async () => readingLoop(signal, reader))();
      } catch (err) {
        if (abortController.signal.aborted) return;

        const isUserCancelled =
          err instanceof DOMException && err.name === "NotFoundError";
        if (isUserCancelled) {
          dispatch({ type: "CONNECT_CANCEL" });
          return;
        }

        const error =
          err instanceof Error ? err : new Error("Failed to connect");
        dispatch({ type: "CONNECT_ERROR", error });
      } finally {
        connectingAbortControllerRef.current = null;
      }
    },
    [state.port],
  );

  const disconnect = useCallback(async () => {
    if (connectingAbortControllerRef.current) {
      connectingAbortControllerRef.current.abort();
      connectingAbortControllerRef.current = null;
      dispatch({ type: "CONNECT_ABORT" });
      return;
    }

    if (!state.port) return;

    try {
      if (subscribeAbortControllerRef.current) {
        subscribeAbortControllerRef.current.abort();
      }
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch {
          // ignore cancel errors
        }
      }
      if (readLoopDoneRef.current) {
        await readLoopDoneRef.current;
      }

      await state.port.close();
      dispatch({ type: "DISCONNECT_SUCCESS" });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to disconnect");
      dispatch({ type: "DISCONNECT_ERROR", error });
    } finally {
      subscribeAbortControllerRef.current = null;
      readerRef.current = null;
      readLoopDoneRef.current = null;
      writeQueueRef.current = Promise.resolve(true);
    }
  }, [state.port]);

  const write = useCallback((): Promise<boolean> => {
    if (!state.port || !state.port.writable) {
      dispatch({
        type: "WRITE_ERROR",
        error: new Error("Port is not writable"),
      });
      return Promise.resolve(false);
    }

    const result = writeQueueRef.current.then(async () => {
      if (!state.port || !state.port.writable) {
        dispatch({
          type: "WRITE_ERROR",
          error: new Error("Port is not writable"),
        });
        return false;
      }

      const writer = state.port.writable.getWriter();
      try {
        await writer.write(textEncoder.encode("READ\r\n"));
        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to write data");
        dispatch({ type: "WRITE_ERROR", error });
        return false;
      } finally {
        writer.releaseLock();
      }
    });

    writeQueueRef.current = result.then(
      () => true,
      () => true,
    );
    return result;
  }, [state.port]);

  const contextValue = useMemo(
    () => ({
      isAvailableSerialApi,
      port: state.port as SerialPortInfo | null,
      isConnecting: state.isConnecting,
      isConnected: state.isConnected,
      isUserCancelled: state.isUserCancelled,
      isSubscribing: state.isSubscribing,
      buffer: state.buffer,
      value: state.value,
      error: state.error,
      connect,
      disconnect,
      write,
    }),
    [
      isAvailableSerialApi,
      state.port,
      state.isConnecting,
      state.isConnected,
      state.isUserCancelled,
      state.error,
      state.isSubscribing,
      state.buffer,
      state.value,
      connect,
      disconnect,
      write,
    ],
  );

  return <SerialContext value={contextValue}>{children}</SerialContext>;
};
