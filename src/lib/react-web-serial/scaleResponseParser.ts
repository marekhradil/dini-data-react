import type { ScaleRextResponse } from "./types";

const ScaleResponseParser = (response: string): ScaleRextResponse => {
  const [scale, status, weight, tare, extra, unit] = response.trim().split(",");

  return {
    scale: Number(scale),
    status,
    weight: Number(weight),
    tare: Number(tare),
    extra: Number(extra),
    unit,
  };
};

export default ScaleResponseParser;
