// client/src/assets/hair/index.ts
export const HAIR_MODELS = {
  short: require('../../../../assets/hair/hair_short.glb'),
  long: require('../../../../assets/hair/hair_long.glb'),
  bun: require('../../../../assets/hair/hair_bun.glb'),
} as const;

export const HAIR_MODEL_LIST = [
  HAIR_MODELS.short,
  HAIR_MODELS.long,
  HAIR_MODELS.bun,
] as const;
