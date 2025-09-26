export interface BroadcastPayload {
  payload: Record<string, unknown>;
}

export interface SupabaseChannel {
  send: (message: { type: string; event: string; payload: Record<string, unknown> }) => void;
  subscribe: (callback: (status: string) => void) => void;
  unsubscribe: () => void;
  on: (type: string, config: { event: string }, callback: (payload: BroadcastPayload) => void) => void;
}

export interface SupabaseClient {
  channel: (name: string, config?: { config: { broadcast: { self: boolean } } }) => SupabaseChannel;
}