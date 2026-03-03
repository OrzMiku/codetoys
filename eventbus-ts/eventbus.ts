/**
 * @file eventbus.ts
 * @description A lightweight, type-safe publish/subscribe event bus.
 * @author OrzMiku <miku@ecy.pink>
 * @license MIT
 * JSDoc written by AI, code handwritten by me.
 */

/**
 * A generic map of event names to their payload types.
 * Use this as the base constraint for the `TMap` type parameter of {@link EventBus}.
 *
 * @example
 * ```ts
 * interface MyEvents extends DefaultEventMap {
 *   userLogin: { userId: string };
 *   pageView: { url: string };
 * }
 * ```
 */
export type DefaultEventMap = Record<string, any>;

/**
 * A function that handles an event emitted by an {@link EventBus}.
 *
 * @template TMap - The event map that defines all event names and their payloads.
 * @template TEvent - The specific event name this handler is registered for.
 *
 * @param payload - The payload associated with the event.
 */
export type EventHandler<TMap, TEvent extends keyof TMap> = (
  payload: TMap[TEvent],
) => void;

/**
 * A function returned by {@link EventBus.on} that, when called, removes
 * the associated handler from the event bus.
 *
 * @example
 * ```ts
 * const unsubscribe = bus.on('userLogin', handler);
 * // later...
 * unsubscribe(); // handler is removed
 * ```
 */
export type Unsubscribe = () => void;

/**
 * A lightweight, type-safe publish/subscribe event bus.
 *
 * Handlers are stored in `Set`s keyed by event name, so the same handler
 * function reference can only be registered once per event. All handlers are
 * invoked **synchronously** in the order they were registered.
 *
 * @template TMap - An object type that maps event names to their payload types.
 *
 * @example
 * ```ts
 * interface AppEvents {
 *   userLogin: { userId: string; username: string };
 *   userLogout: { userId: string };
 * }
 *
 * const bus = new EventBus<AppEvents>();
 *
 * const unsubscribe = bus.on('userLogin', ({ userId, username }) => {
 *   console.log(`${username} logged in`);
 * });
 *
 * bus.emit('userLogin', { userId: '1', username: 'Alice' });
 * unsubscribe(); // stop listening
 * ```
 */
export class EventBus<TMap extends DefaultEventMap> {
  /**
   * Internal registry mapping each event name to the set of handlers
   * currently subscribed to it. Entries are created lazily on first
   * subscription and deleted implicitly when the last handler is removed.
   */
  private handlerRegistry: { [K in keyof TMap]?: Set<EventHandler<TMap, K>> } =
    {};

  /**
   * Subscribe to an event. The `handler` will be called every time the event
   * is emitted until it is explicitly removed.
   *
   * The same handler reference is deduplicated per event — registering the
   * same function twice has no additional effect (because handlers are stored
   * in a `Set`).
   *
   * @template TEvent - The event name to listen for (inferred from `eventName`).
   *
   * @param eventName - The name of the event to subscribe to.
   * @param handler   - The callback to invoke when the event is emitted.
   * @returns An {@link Unsubscribe} function that removes this handler when called.
   *
   * @example
   * ```ts
   * const off = bus.on('userLogin', (payload) => console.log(payload.username));
   * // remove later:
   * off();
   * ```
   */
  on<TEvent extends keyof TMap>(
    eventName: TEvent,
    handler: EventHandler<TMap, TEvent>,
  ): Unsubscribe {
    if (!this.handlerRegistry[eventName]) {
      this.handlerRegistry[eventName] = new Set() as any;
    }
    const targetSet = this.handlerRegistry[eventName] as Set<
      EventHandler<TMap, TEvent>
    >;
    targetSet.add(handler);
    return () => this.off(eventName, handler);
  }

  /**
   * Unsubscribe a specific handler from an event.
   *
   * If the handler was not previously registered, or if no handlers exist for
   * the given event, this method does nothing.
   *
   * @template TEvent - The event name (inferred from `eventName`).
   *
   * @param eventName - The name of the event to unsubscribe from.
   * @param handler   - The exact handler reference that was passed to {@link on} or {@link once}.
   *
   * @example
   * ```ts
   * const handler = (payload: { userId: string }) => console.log(payload.userId);
   * bus.on('userLogin', handler);
   * bus.off('userLogin', handler); // handler will no longer be called
   * ```
   */
  off<TEvent extends keyof TMap>(
    eventName: TEvent,
    handler: EventHandler<TMap, TEvent>,
  ) {
    const targetSet = this.handlerRegistry[eventName];
    if (!targetSet) return;
    targetSet.delete(handler);
  }

  /**
   * Subscribe to an event for **one emission only**. The handler is
   * automatically removed after it fires for the first time.
   *
   * Internally, `once` wraps the provided handler in a one-shot function that
   * calls {@link off} on itself after the first invocation.
   *
   * @template TEvent - The event name (inferred from `eventName`).
   *
   * @param eventName - The name of the event to listen for.
   * @param handler   - The callback to invoke once when the event is emitted.
   *
   * @example
   * ```ts
   * bus.once('userLogin', ({ username }) => {
   *   console.log(`First login: ${username}`);
   * });
   * bus.emit('userLogin', { userId: '1', username: 'Alice' }); // handler fires
   * bus.emit('userLogin', { userId: '2', username: 'Bob' });   // handler silent
   * ```
   */
  once<TEvent extends keyof TMap>(
    eventName: TEvent,
    handler: EventHandler<TMap, TEvent>,
  ) {
    const onceHandler = (payload: TMap[TEvent]) => {
      handler(payload);
      this.off(eventName, onceHandler as EventHandler<TMap, TEvent>);
    };
    this.on(eventName, onceHandler as EventHandler<TMap, TEvent>);
  }

  /**
   * Emit an event, synchronously invoking all handlers currently subscribed to it.
   *
   * Handlers are called in the order they were registered. The internal set is
   * snapshotted before iteration, so handlers added or removed during emission
   * do not affect the current dispatch cycle.
   *
   * If no handlers are registered for `eventName`, this method does nothing.
   *
   * @template TEvent - The event name (inferred from `eventName`).
   *
   * @param eventName - The name of the event to emit.
   * @param payload   - The data to pass to each handler.
   *
   * @example
   * ```ts
   * bus.emit('userLogin', { userId: '42', username: 'Alice' });
   * ```
   */
  emit<TEvent extends keyof TMap>(eventName: TEvent, payload: TMap[TEvent]) {
    const targetSet = this.handlerRegistry[eventName];
    if (!targetSet) return;
    [...targetSet].forEach((handler) => handler(payload));
  }

  /**
   * Remove **all** handlers for **all** events, resetting the bus to its
   * initial empty state.
   *
   * Useful for teardown in tests or when destroying a component/module that
   * owns the bus.
   *
   * @example
   * ```ts
   * bus.clear(); // no handlers remain; subsequent emits are no-ops
   * ```
   */
  clear() {
    this.handlerRegistry = {};
  }
}
