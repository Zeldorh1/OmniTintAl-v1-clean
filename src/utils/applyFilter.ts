// /src/utils/applyFilter.ts
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

/**
 * applyFilterLive
 * Returns a style object for live filters (used on <Image> / <Animated.Image>)
 */
export function applyFilterLive(shader: string) {
  return { filter: shader };
}

/**
 * applyFilterToCapture
 * Applies a filter to a saved screenshot using expo-image-manipulator
 * Returns new URI
 */
export async function applyFilterToCapture(uri: string, shader: string): Promise<string> {
  try {
    const actions: any[] = [];

    const grab = (exp: RegExp) => {
      const m = shader.match(exp);
      return m ? parseFloat(m[1]) : undefined;
    };

    const brightness = grab(/brightness\(([\d.]+)\)/);
    const contrast = grab(/contrast\(([\d.]+)\)/);
    const saturation = grab(/saturate\(([\d.]+)\)/);
    const sepia = grab(/sepia\(([\d.]+)\)/);
    const hue = grab(/hueRotate\(([\d.]+)deg\)/);

    if (brightness !== undefined) actions.push({ adjust: { brightness } });
    if (contrast !== undefined) actions.push({ adjust: { contrast } });
    if (saturation !== undefined) actions.push({ adjust: { saturation } });
    if (sepia !== undefined) actions.push({ adjust: { saturation: 1 - sepia } }); // quick approximation
    if (hue !== undefined)
      actions.push({ rotate: hue > 180 ? 360 - hue : hue }); // optional rotation for creative tinting

    if (!actions.length) return uri;

    const result = await manipulateAsync(uri, actions, {
      compress: 1,
      format: SaveFormat.PNG,
    });
    return result.uri;
  } catch (e) {
    console.warn("applyFilterToCapture failed", e);
    return uri;
  }
}
