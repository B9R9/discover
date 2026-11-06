import type { StyleSpecification } from '@maplibre/maplibre-react-native';
import { useCallback, useEffect, useState } from 'react';

import { getSetting } from '@/db/settings';
import type { Db } from '@/db/types';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { colors, colorsDark, type ThemeColors } from '@/theme/tokens';

import { LIBERTY_STYLE_URL, type MapStyleKind } from './mapStyle';
import { isStyleJson, themeStyle, type StyleJson } from './themeStyle';

export interface MapLook {
  kind: MapStyleKind;
  mapStyle: string | StyleSpecification;
  // Palette of the map itself: the fog, markers and trail must match the style under them.
  colors: ThemeColors;
  hatch: 'fog-hatch' | 'fog-hatch-light';
}

// One download per launch. A failed one is not kept, so the next screen focus tries again.
let libertyPromise: Promise<StyleJson | null> | null = null;

function loadLiberty(): Promise<StyleJson | null> {
  libertyPromise ??= fetchWithTimeout(LIBERTY_STYLE_URL)
    .then(({ ok, text }) => {
      const parsed: unknown = ok ? JSON.parse(text) : null;
      return isStyleJson(parsed) ? parsed : null;
    })
    .catch(() => null)
    .then((style) => {
      if (!style) libertyPromise = null;
      return style;
    });
  return libertyPromise;
}

function lookOf(kind: MapStyleKind, base: StyleJson | null): MapLook {
  const dark = kind === 'sombre';
  const palette = dark ? colorsDark : colors;
  const hatch = dark ? 'fog-hatch-light' : 'fog-hatch';
  // Until the style is downloaded (or if it cannot be), show Liberty by URL: a colored map beats a blank one.
  if (kind === 'classique' || !base) {
    return {
      kind,
      mapStyle: LIBERTY_STYLE_URL,
      colors: kind === 'sombre' ? palette : colors,
      hatch,
    };
  }
  // The validated JSON has the shape of a style: the library types it more strictly than we do.
  return {
    kind,
    mapStyle: themeStyle(base, palette) as unknown as StyleSpecification,
    colors: palette,
    hatch,
  };
}

// `reload` re-reads the setting: call it when the map screen regains focus, since it is changed in the Profile.
export function useMapStyle(db: Db): [MapLook, () => void] {
  const [kind, setKind] = useState<MapStyleKind>('carnet');
  const [base, setBase] = useState<StyleJson | null>(null);

  const reload = useCallback(() => {
    getSetting(db, 'mapStyle').then(setKind);
  }, [db]);

  useEffect(reload, [reload]);

  useEffect(() => {
    if (kind === 'classique' || base) return;
    let cancelled = false;
    loadLiberty().then((style) => {
      if (!cancelled) setBase(style);
    });
    return () => {
      cancelled = true;
    };
  }, [kind, base]);

  return [lookOf(kind, base), reload];
}
