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
    isSubscribing,
    buffer,
    value,
    error,
    connect: contextConnect,
    disconnect,
    scaleResponse,
  } = context;

  const connect = () =>
    contextConnect({
      options,
      requestOptions,
    });

  return {
    isAvailableSerialApi,
    port,
    isConnecting,
    isConnected,
    isSubscribing,
    buffer,
    value,
    error,
    connect,
    disconnect,
    scaleResponse,
  };
};
