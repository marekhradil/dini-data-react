import { useContext } from "react";
import { SerialContext } from "./context";
import type { UseSerialPortParams, UseSerialPortReturn } from "./types";

export const useSerialPort = ({
	options,
	requestOptions,
	maxReceivedDataCount,
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
		receivedData,
		error,
		connect: contextConnect,
		disconnect,
		write,
		startSubscribe: contextStartSubscribe,
		stopSubscribe,
		clearReceivedData,
	} = context;

	const connect = () =>
		contextConnect({
			options,
			requestOptions,
		});

	const startSubscribe = () =>
		contextStartSubscribe({ maxReceivedDataCount });

	return {
		isAvailableSerialApi,
		port,
		isConnecting,
		isConnected,
		isUserCancelled,
		isSubscribing,
		receivedData,
		error,
		connect,
		disconnect,
		write,
		startSubscribe,
		stopSubscribe,
		clearReceivedData,
	};
};
