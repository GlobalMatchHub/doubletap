export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: unknown;
}
export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}
export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}
export type JsonRpcMessage = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;

/** How much of a frame to let through, and what to do after. */
export interface SendFault {
  /** Write only this many bytes of the serialised frame. */
  cutAfterBytes?: number;
  /** Close the server's stdin after writing, simulating a dropped connection. */
  closeAfter?: boolean;
  /** SIGKILL the server after writing. */
  killAfter?: boolean;
  /** Real milliseconds to wait between writing and the SIGKILL. Sweeping this
   *  is how the window between 'effect applied' and 'answer sent' is found. */
  killAfterMs?: number;
  /** Real milliseconds to stall before writing. */
  delayMs?: number;
}

export interface Transport {
  readonly kind: "stdio" | "http";
  start(): Promise<void>;
  /** Sends a frame. Returns the bytes actually written and the wire form. */
  sendRaw(msg: unknown, fault?: SendFault): Promise<{ wrote: number; of: number; wire: string }>;
  onMessage(handler: (msg: unknown, raw: string) => void): void;
  onClose(handler: (info: { code: number | null; signal: string | null }) => void): void;
  stderr(): string;
  close(): Promise<void>;
  readonly alive: boolean;
}
