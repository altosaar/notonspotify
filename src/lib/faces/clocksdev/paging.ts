/**
 * How many clocks the picker shows at once.
 *
 * Its own module because Astro evaluates `getStaticPaths` in a scope of its own,
 * where nothing declared in the page's frontmatter exists — only imports. The
 * page needs this number in both places, and two copies of it would drift.
 */
export const PER_PAGE = 10;
