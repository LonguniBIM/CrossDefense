import type { ContentPackManifest } from './contentPack';
export const RENDERED_CONTENT_VERSION='development-rendered-combat-ship-v1';
export const REVIEW_CONTENT_VERSION='development-review-ship-v1';
export const RENDERED_MANIFEST_SHA256='24e36111ee6c84a28ffc8f34c28637c315020e2760ee630dce577a3153d153f1';
export const REVIEW_MANIFEST_SHA256='1b496a087a3c9f576164c83653736dbd40f6d749eeea9adffa5cda3fc127b9b6';
export function assertRenderPackIdentity(pack: Pick<ContentPackManifest, 'contentVersion' | 'integrity'>): void {
  const expected = pack.contentVersion === RENDERED_CONTENT_VERSION ? RENDERED_MANIFEST_SHA256 :
    pack.contentVersion === REVIEW_CONTENT_VERSION ? REVIEW_MANIFEST_SHA256 : undefined;
  if (!expected) throw Error('This pinned content does not provide Q14 graphics.');
  if (pack.integrity.manifestSha256 !== expected) throw Error('Pinned render pack digest differs from its approved content identity.');
}
export function hasRenderAssets(contentVersion: string): boolean {
  return contentVersion === RENDERED_CONTENT_VERSION || contentVersion === REVIEW_CONTENT_VERSION;
}
export const RENDER_ASSETS=[
  {
    "path": "licenses/Kenney-Particle.txt",
    "bytes": 651,
    "sha256": "f9e70b81d8cc07c4e07c9f2eff1d94fd371a06070b18cb67c651c41158ec2975"
  },
  {
    "path": "licenses/Kenney-Smoke.txt",
    "bytes": 486,
    "sha256": "16dffa20429eccd9a6ddbffffe7870191974975d192d3934e53da5d486ed2e4f"
  },
  {
    "path": "licenses/Quaternius.txt",
    "bytes": 364,
    "sha256": "83d8959f9fc56353ed571fbe2dc52e4bcd64508e2399501cd45ac2ce3df0bf8c"
  },
  {
    "path": "particles/circle_03.png",
    "bytes": 72952,
    "sha256": "ed6c6f082e666c16bcaca89f15aefb55df9bf69450090518bcae1d3d61f82936"
  },
  {
    "path": "particles/flame_01.png",
    "bytes": 54099,
    "sha256": "92a70bcb90b1e21c57b2dae42843135703b2e988abee97433f84c3119723d144"
  },
  {
    "path": "particles/flare_01.png",
    "bytes": 42886,
    "sha256": "254f5bd4f0548612bf29305d27899efdee8cb8d8306292761ebbddebd3e57935"
  },
  {
    "path": "particles/muzzle_01.png",
    "bytes": 81811,
    "sha256": "08f650f6a615b65024b48d8da32178158d74307d7c235f214f0c075b7aa688b9"
  },
  {
    "path": "particles/smoke.png",
    "bytes": 57599,
    "sha256": "33f894c2279bee9f77874dbfa3c0e9f071a0ee5e1a7065dcc40196029d699f58"
  },
  {
    "path": "particles/spark_05.png",
    "bytes": 64808,
    "sha256": "9624ea2017b8b2767a9d3b82e978b7fdf5154d83e6756cd919da51447bb97138"
  },
  {
    "path": "particles/trace_01.png",
    "bytes": 38406,
    "sha256": "34de69bc3f665b23fe9bed15f388efd8e8e4dc1a99f2fc5db9ba8715c525711f"
  },
  {
    "path": "ships/Dispatcher.gltf",
    "bytes": 3165384,
    "sha256": "e76c42a694ac602152ee0c8a897f6c79a894da716d22410838892df0d04e8d5c"
  },
  {
    "path": "ships/Dispatcher_Red.png",
    "bytes": 2230020,
    "sha256": "95535f134b015ce8f20e9bc87b10db3819b4b671f2a42743ea56daa2856915aa"
  },
  {
    "path": "ships/Striker.gltf",
    "bytes": 2704340,
    "sha256": "2f6c4b1d16f11d5ce02833c5841ff17e19700418c83e52501ed29e3c2bc79359"
  },
  {
    "path": "ships/Striker_Blue.png",
    "bytes": 1986107,
    "sha256": "38b2477b43a1253a15a3bdf4eec3473d334f9c281049b6cb7daeea265a955435"
  }
] as const;
/** Q14's exact asset contract is inherited by Q15; legacy non-rendered content is unchanged. */
export function assertRenderAssets(pack: Pick<ContentPackManifest,'contentVersion'|'assetManifest'>): void {
  if(!hasRenderAssets(pack.contentVersion))return;
  if(pack.assetManifest.length!==RENDER_ASSETS.length||RENDER_ASSETS.some(expected=>!pack.assetManifest.some(actual=>actual.path===expected.path&&actual.bytes===expected.bytes&&actual.sha256===expected.sha256)))throw Error('Q14 render assets are incomplete or differ from the approved manifest.');
}
