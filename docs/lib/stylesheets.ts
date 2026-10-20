/** Every rule in every loaded sheet, descending into grouping rules. */
function walkRules(visit: (rule: CSSRule) => void) {
  const walk = (rules: CSSRuleList) => {
    for (const rule of rules) {
      visit(rule);
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
}

function notLoaded(what: string) {
  return new Error(
    `No ${what} is loaded. Either @timhettler/radix-layout is unbuilt or ` +
      ".storybook/preview.ts stopped importing styles.css — run `yarn build` " +
      "before assuming the check is wrong.",
  );
}

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

  walkRules((rule) => {
    if (rule instanceof CSSStyleRule) {
      for (const match of rule.selectorText.matchAll(pattern)) {
        found.add(match[1]);
      }
    }
  });

  if (found.size === 0) throw notLoaded(`.${block}[${attribute}] rule`);
  return [...found];
}

/**
 * The keywords a registered custom property accepts, in `syntax` order, and
 * its initial value, read from its `@property` rule.
 */
export function registeredProperty(name: string): {
  values: string[];
  initial: string;
} {
  let found: CSSPropertyRule | undefined;
  walkRules((rule) => {
    if (rule instanceof CSSPropertyRule && rule.name === name) found = rule;
  });

  if (!found) throw notLoaded(`@property ${name} rule`);
  return {
    values: found.syntax.split("|").map((keyword) => keyword.trim()),
    initial: (found.initialValue ?? "").trim(),
  };
}

/** The values the loaded `@container style(<property>: …)` conditions test. */
export function containerStyleValues(property: string): string[] {
  const pattern = new RegExp(
    String.raw`style\(\s*${property}\s*:\s*([^\s)]+)\s*\)`,
    "g",
  );
  const found = new Set<string>();

  walkRules((rule) => {
    if (rule instanceof CSSContainerRule) {
      for (const match of rule.conditionText.matchAll(pattern)) {
        found.add(match[1]);
      }
    }
  });

  if (found.size === 0) throw notLoaded(`@container style(${property}) rule`);
  return [...found];
}
