/**
 * Every face name the build may deal from — the mirrors, minus anything turned
 * off in faces.json.
 *
 * Names only, and no Svelte anywhere in the import graph, so `tsx` can load this
 * during the build without a component compiler.
 */
export { ELIGIBLE_NAMES as FACE_NAMES } from "./eligible.ts";
