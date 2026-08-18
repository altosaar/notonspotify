/**
 * Mounting one mirrored component, and taking it down again.
 *
 * `.svelte.ts` rather than `.ts` on purpose: `$state` is a rune, and runes are
 * only compiled in a module the Svelte plugin treats as one. That reactive
 * object is the only way a component mounted by hand hears about a new prop —
 * handing `mount()` a plain object would render once and then go still.
 */
import { mount, unmount, type Component } from "svelte";
import type { ClockTime } from "./time.ts";

export interface Mounted {
  set(time: ClockTime): void;
  destroy(): void;
}

export function mountClock(
  component: Component<{ time: ClockTime }>,
  host: HTMLElement,
  initial: ClockTime,
): Mounted {
  const props = $state({ time: initial });
  const instance = mount(component, { target: host, props });
  return {
    // A whole new object each frame rather than a mutation: these components
    // read `time.mm` and friends off the object they were handed, and several
    // derive from it, so replacing it is what makes every one of them update.
    set(time) {
      props.time = time;
    },
    // Without this the component's effects keep running after the clock has
    // moved on — twenty-odd track changes later that is twenty-odd invisible
    // clocks still animating.
    destroy() {
      void unmount(instance);
    },
  };
}
