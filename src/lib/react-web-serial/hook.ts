import { useContext } from "react";
import { SerialContext } from "./context";
import type { UseSerialPortParams, UseSerialPortReturn } from "./types";

export const useSerialPort = ({
  options,
  requestOptions,
}: UseSerialPortParams): UseSerialPortReturn => {
  const context = useContext(SerialContext);
  if (!context) {
    throw new Error("useSerialPort must be used within a SerialProvider");
  }

  const {
    isAvailableSerialApi,
    port,
    isConnecting,
    isConnected,
    isUserCancelled,
    isSubscribing,
    buffer,
    value,
    error,
    connect: contextConnect,
    disconnect,
    write,
  } = context;

  const connect = () =>
    contextConnect({
      options,
      requestOptions,
    });

  //const startSubscribe = () => contextStartSubscribe({ maxReceivedDataCount });

  return {
    isAvailableSerialApi,
    port,
    isConnecting,
    isConnected,
    isUserCancelled,
    isSubscribing,
    buffer,
    value,
    error,
    connect,
    disconnect,
    write,
  };
};
