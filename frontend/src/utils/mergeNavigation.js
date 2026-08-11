export function mergeNavigation(defaults, overrides) {
  if (!overrides || overrides.length === 0) return defaults;

  const merged = defaults.map(item => {
    const match = overrides.find(o => o.key === item.key);
    if (!match) return item;
    return {
      ...item,
      label: match.label ?? item.label,
      href: match.href ?? item.href,
      url: match.url ?? item.url ?? item.href,
      isHidden: match.isHidden ?? item.isHidden ?? false,
    };
  });

  const overridesByKey = new Map(overrides.map(o => [o.key, o]));
  const defaultKeys = new Set(defaults.map(d => d.key));

  const customItems = overrides.filter(o => !defaultKeys.has(o.key));

  for (const item of customItems) {
    const pos = item.position || 'last';
    if (pos === 'first') {
      merged.unshift({ ...item, isCustom: true });
    } else if (pos.startsWith('before:')) {
      const idx = merged.findIndex(i => i.key === pos.slice(7));
      if (idx >= 0) merged.splice(idx, 0, { ...item, isCustom: true });
      else merged.push({ ...item, isCustom: true });
    } else if (pos.startsWith('after:')) {
      const idx = merged.findIndex(i => i.key === pos.slice(6));
      if (idx >= 0) merged.splice(idx + 1, 0, { ...item, isCustom: true });
      else merged.push({ ...item, isCustom: true });
    } else {
      merged.push({ ...item, isCustom: true });
    }
  }

  const reorderMap = new Map();
  overrides.forEach(o => {
    if (o.position && defaultKeys.has(o.key)) {
      reorderMap.set(o.key, o.position);
    }
  });

  if (reorderMap.size > 0) {
    const pinned = [];
    const rest = [];
    for (const item of merged) {
      const pos = reorderMap.get(item.key);
      if (pos === 'first') pinned.unshift(item);
      else if (pos === 'last') pinned.push(item);
      else rest.push(item);
    }
    merged.length = 0;
    merged.push(...pinned, ...rest);
  }

  return merged.filter(item => !item.isHidden);
}
