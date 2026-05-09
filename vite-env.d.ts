/// <reference types="vite/client" />

declare module "@garmin/fitsdk" {
  interface FitMessage {
    positionLat?: number;
    positionLong?: number;
    altitude?: number;
    timestamp?: number | Date;
    heartRate?: number;
    cadence?: number;
    [key: string]: unknown;
  }

  interface FitMessages {
    recordMesgs?: FitMessage[];
    [key: string]: unknown;
  }

  interface Stream {
    // Stream instance methods
  }

  interface Decoder {
    read(): { messages: FitMessages };
  }

  export const Stream: {
    fromArrayBuffer(buffer: ArrayBuffer): Stream;
  };

  export const Decoder: {
    new (stream: Stream): Decoder;
  };

  export const CrcCalculator: unknown;
  export const Encoder: unknown;
  export const Profile: unknown;
  export const Utils: unknown;
}
