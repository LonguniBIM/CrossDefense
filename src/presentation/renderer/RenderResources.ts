import * as THREE from 'three';

/** One explicit owner per GPU allocation; shared hull assets outlive per-fleet equipment. */
export class RenderResources {
  private readonly disposables = new Set<{ dispose(): void }>();
  private readonly bitmaps = new Set<ImageBitmap>();
  private ended = false;
  created = 0;
  released = 0;

  own<T extends { dispose(): void }>(value: T): T {
    if (this.ended) { value.dispose(); this.created++; this.released++; return value; }
    if (!this.disposables.has(value)) { this.disposables.add(value); this.created++; }
    return value;
  }
  bitmap(value: ImageBitmap): ImageBitmap {
    if (this.ended) { value.close(); this.created++; this.released++; return value; }
    if (!this.bitmaps.has(value)) { this.bitmaps.add(value); this.created++; }
    return value;
  }
  track(root: THREE.Object3D): void {
    root.traverse(object => {
      const renderable = object as THREE.Mesh;
      if (renderable.geometry) this.own(renderable.geometry);
      for (const material of Array.isArray(renderable.material) ? renderable.material : renderable.material ? [renderable.material] : []) {
        this.own(material);
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) {
          this.own(value);
          if (typeof ImageBitmap !== 'undefined' && value.image instanceof ImageBitmap) this.bitmap(value.image);
        }
      }
    });
  }
  releaseTexture(texture:THREE.Texture):void {
    if(this.disposables.delete(texture)){texture.dispose();this.released++;}
    if(typeof ImageBitmap!=='undefined'&&texture.image instanceof ImageBitmap&&this.bitmaps.delete(texture.image)){texture.image.close();this.released++;}
  }
  get alive(): number { return this.disposables.size + this.bitmaps.size; }
  dispose(): void {
    if (this.ended) return;
    this.ended = true;
    for (const value of this.disposables) { value.dispose(); this.released++; }
    for (const bitmap of this.bitmaps) { bitmap.close(); this.released++; }
    this.disposables.clear(); this.bitmaps.clear();
  }
}
