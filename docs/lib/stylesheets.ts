/**
 * The values a component's stylesheet accepts for one of its `data-*` axes,
 * scraped from the CSS the browser actually loaded.
 *
 * The independent half of a vocabulary check. An attribute vocabulary is only
 * real if the stylesheet emits a rule for every value the component's list
 * accepts — a value added to the list with no matching CSS rule typechecks and
 * renders an attribute that matches nothing. Comparing the two is what catches
 * that, and they have to come from different places for the comparison to mean
 * anything: these are read out of the compiled stylesheet, never from the Sass
 * that generated it.
 *
 * **The other side is a runtime list, and the prop's type is derived from it**
 * — `type StackAlign = (typeof ALIGN)[number]`, with `stackAligns` the same
 * array. That is what makes "the union" and "the list" the same statement, and
 * it is a property of how the components are written rather than one this
 * comparison enforces. Deriving the type is the thing to preserve.
 *
 * Both serialisations are matched: a value that is not a valid CSS identifier
 * keeps its quotes (`[data-space="1"]`) while a keyword may lose them
 * (`[data-justify=start]`), and which form the CSSOM returns is the engine's
 * business. Earlier attributes on the same compound selector are skipped, and
 * grouping rules (`@layer`, `@media`) are descended into.
 *
 * Throws on an empty result rather than returning `[]`, so the failure says
 * which stylesheet is missing instead of printing a confusing array diff.
 */
export function componentAttributeValues(
  block: string,
  attribute: string,
): string[] {
  const pattern = new RegExp(
    String.raw`\.${block}(?:\[[^\]]*\])*?\[${attribute}=["']?([^\]"']+)`,
    "g",
  );
  const found = new Set<string>();

  const walk = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        for (const match of rule.selectorText.matchAll(pattern)) {
          found.add(match[1]);
        }
      }
      const nested = (rule as CSSGroupingRule).cssRules;
      if (nested) walk(nested);
    }
  };

  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {
      continue; // A cross-origin sheet throws on cssRules and has nothing to say about this.
    }
  }
  if (found.size === 0) {
    throw new Error(
      `No .${block}[${attribute}] rule is loaded. Either @timhettler/radix-layout ` +
        "is unbuilt or .storybook/preview.ts stopped importing styles.css — run " +
        "`yarn build` before assuming the check is wrong.",
    );
  }
  return [...found];
}
