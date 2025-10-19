/**
 * External type definitions for EventBroker integration
 *
 * Type stubs to avoid circular dependencies with @event-broker/core
 */

// EventBroker basic types (stubs)
export interface Event<T = any, D = any> {
  id: string;
  type: T;
  source: string;
  time?: string;
  data?: D;
}

export type HookResult =
  | { allowed: true }
  | { allowed: false; message: string };

export interface EventBroker<T = any, P = any, C = any> {
  useOnSubscribeHandler?(
    hook: (eventType: T, clientId: string) => HookResult
  ): () => void;
  useBeforeSendHook(hook: (event: Event<T, P>) => HookResult): () => void;
  useAfterSendHook(
    hook: (event: Event<T, P>, eventResult: any) => void
  ): () => void;
}
