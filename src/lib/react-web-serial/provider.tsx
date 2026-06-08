import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { SerialContext } from "./context";
import { initialState, serialReducer } from "./serialReducer";
import type { SerialReceivedDataEntry, UseSerialPortParams } from "./types";

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
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(
    null,
  );
  const readLoopDoneRef = useRef<Promise<void> | null>(null);
  const writeLoopDoneRef = useRef<Promise<void> | null>(null);

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
      writeLoopDoneRef.current = null;
    };
  }, [state.port]);

  const writingLoop = async (
    signal: AbortSignal,
    writer: WritableStreamDefaultWriter<Uint8Array>,
  ) => {
    try {
      while (!signal.aborted) {
        await writer.write(textEncoder.encode("REXT\r\n"));
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (err) {
      if (!signal.aborted) {
        const error =
          err instanceof Error ? err : new Error("Failed to write data");
        dispatch({ type: "WRITE_ERROR", error });
      }
    }
    writer.releaseLock();
    writerRef.current = null;
    writeLoopDoneRef.current = null;
  };

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

      const connectAbortController = new AbortController();
      connectingAbortControllerRef.current = connectAbortController;
      dispatch({ type: "CONNECT_START" });

      try {
        const requestedPort =
          await navigator.serial.requestPort(requestOptions);
        await requestedPort.open(options);

        if (connectAbortController.signal.aborted) {
          try {
            await requestedPort.close();
          } catch {
            // ignore close errors on abort
          }
          return;
        }

        dispatch({ type: "CONNECT_SUCCESS", port: requestedPort });
        connectingAbortControllerRef.current = null;

        if (
          !requestedPort ||
          !requestedPort.readable ||
          !requestedPort.writable
        ) {
          dispatch({
            type: "SUBSCRIBE_ERROR",
            error: new Error("Port is not connected or not readable/writable"),
          });

          return;
        }

        const subscribeAbortController = new AbortController();
        subscribeAbortControllerRef.current = subscribeAbortController;
        const signal = subscribeAbortController.signal;

        let reader: ReadableStreamDefaultReader<Uint8Array>;
        let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
        try {
          reader = requestedPort.readable.getReader();
          writer = requestedPort.writable?.getWriter() || null;
        } catch (err) {
          subscribeAbortControllerRef.current = null;
          const error =
            err instanceof Error ? err : new Error("Failed to start subscribe");
          dispatch({ type: "SUBSCRIBE_ERROR", error });
          return;
        }

        readerRef.current = reader;
        writerRef.current = writer;
        dispatch({ type: "SUBSCRIBE_START" });

        readLoopDoneRef.current = (async () => readingLoop(signal, reader))();
        if (writer)
          writeLoopDoneRef.current = (async () =>
            writingLoop(signal, writer))();
      } catch (err) {
        if (connectAbortController.signal.aborted) return;

        const error =
          err instanceof Error ? err : new Error("Failed to connect");
        dispatch({ type: "CONNECT_ERROR", error });
      } finally {
        connectingAbortControllerRef.current = null;
      }
      dispatch({ type: "SUBSCRIBE_FINISH" });
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
          console.warn("Failed to cancel reader during disconnect");
        }
      }
      if (writerRef.current) {
        try {
          await writerRef.current.close();
        } catch {
          console.warn("Failed to close writer during disconnect");
        }
      }
      if (readLoopDoneRef.current) {
        await readLoopDoneRef.current;
      }
      if (writeLoopDoneRef.current) {
        await writeLoopDoneRef.current;
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
      writerRef.current = null;
      writeLoopDoneRef.current = null;
    }
  }, [state.port]);

  const contextValue = useMemo(
    () => ({
      isAvailableSerialApi,
      port: state.port || null,
      isConnecting: state.isConnecting,
      isConnected: state.isConnected,
      isSubscribing: state.isSubscribing,
      value: state.value,
      buffer: state.buffer,
      error: state.error,
      connect,
      disconnect,
      scaleResponse: state.scaleResponse,
    }),
    [
      isAvailableSerialApi,
      state.port,
      state.isConnecting,
      state.isConnected,
      state.error,
      state.isSubscribing,
      state.value,
      state.buffer,
      connect,
      disconnect,
      state.scaleResponse,
    ],
  );

  return <SerialContext value={contextValue}>{children}</SerialContext>;
};
