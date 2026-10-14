/**
 * The values a stylesheet accepts for one data-* axis, read from the loaded
 * CSSOM, never the Sass, so the comparison with the component's list is
 * independent. Matches quoted and unquoted serialisations and descends into
 * grouping rules. Throws on no match so a missing stylesheet reads as one.
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
