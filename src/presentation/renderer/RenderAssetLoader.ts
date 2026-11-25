import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { ContentPackManifest } from '../../domain/content/contentPack';
import { assertRenderAssets, assertRenderPackIdentity } from '../../domain/content/renderAssets';
import { sha256 } from '../../application/content/ContentPackCodec';
import { RenderResources } from './RenderResources';

export interface LoadedRenderAssets {
  models: ReadonlyMap<string, THREE.Group>;
  textures: ReadonlyMap<string, THREE.Texture>;
}

/** Decode only approved immutable Q14/Q15 packs, never caller-provided URLs or unpinned assets. */
export async function loadRenderAssets(pack: ContentPackManifest, resources: RenderResources, signal: AbortSignal): Promise<LoadedRenderAssets> {
  assertRenderPackIdentity(pack);
  assertRenderAssets(pack);
  const check = () => { if (signal.aborted) throw new DOMException('Renderer loading was cancelled.', 'AbortError'); };
  const bytes = async (path: string): Promise<Uint8Array<ArrayBuffer>> => {
    check();
    const asset = pack.assetManifest.find(entry => entry.path === path);
    if (!asset) throw new Error('Pinned render asset is missing: ' + path);
    const raw = Uint8Array.from(atob(asset.dataBase64), char => char.charCodeAt(0));
    if (raw.length !== asset.bytes || await sha256(raw) !== asset.sha256) throw new Error('Pinned render asset failed integrity: ' + path);
    check(); return raw;
  };
  const textures = new Map<string, THREE.Texture>();
  const models = new Map<string, THREE.Group>();
  const manager = new THREE.LoadingManager();
  // Q14 glTF inputs are prevalidated embedded documents. Deny external resource fetches.
  manager.setURLModifier(url => {
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    throw new Error('External resources are not allowed in Q14 render assets.');
  });
  const loader = new GLTFLoader(manager);
  for (const [name, color] of [['Striker','Blue'], ['Dispatcher','Red']] as const) {
    const document = JSON.parse(new TextDecoder().decode(await bytes('ships/' + name + '.gltf')));
    if (document.asset?.version !== '2.0' || document.extensionsRequired?.length ||
        [...(document.buffers ?? []), ...(document.images ?? [])].some((entry: {uri?: string}) => entry.uri !== undefined && !entry.uri.startsWith('data:'))) {
      throw new Error('Q14 glTF must contain only embedded glTF 2.0 resources.');
    }
    const loaded = await loader.parseAsync(JSON.stringify(document), '');
    resources.track(loaded.scene); check();
    const bitmap = resources.bitmap(await createImageBitmap(new Blob([await bytes('ships/' + name + '_' + color + '.png')], {type:'image/png'})));
    check();
    const texture = resources.own(new THREE.Texture(bitmap));
    texture.colorSpace = THREE.SRGBColorSpace; texture.flipY = false; texture.needsUpdate = true;
    loaded.scene.traverse(object => {
      if (object instanceof THREE.Mesh) for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material instanceof THREE.MeshStandardMaterial) { if(material.map&&material.map!==texture)resources.releaseTexture(material.map);material.map = texture; material.roughness = 0.62; material.metalness = 0.2; }
      }
    });
    models.set(name, loaded.scene);
  }
  for (const name of ['circle_03','flame_01','flare_01','muzzle_01','smoke','spark_05','trace_01']) {
    const bitmap = resources.bitmap(await createImageBitmap(new Blob([await bytes('particles/' + name + '.png')], {type:'image/png'}), {imageOrientation:'flipY'}));
    check();
    const texture = resources.own(new THREE.Texture(bitmap));
    texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true;
    textures.set(name, texture);
  }
  return {models, textures};
}
