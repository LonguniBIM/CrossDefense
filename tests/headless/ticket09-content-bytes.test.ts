import {expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import {validateContentPack} from '../../src/application/content/ContentPackCodec';
import {syntheticPack,sealFixture} from '../developmentPackFixture';

/** Independent Node byte/base64/digest oracle; these bytes are never shipped as content. */
function largeAssetPack(){
  const bytes=Buffer.alloc(1024*1024+1);
  for(let i=0;i<bytes.length;i++)bytes[i]=i&255;
  const asset={path:'all-byte-values.bin',provenance:'Synthetic large binary boundary fixture only.',bytes:bytes.length,
    dataBase64:bytes.toString('base64'),sha256:createHash('sha256').update(bytes).digest('hex')};
  return {bytes,pack:syntheticPack({assetManifest:[asset]})};
}

it('CS09-03 large canonical binary with every byte value validates against independent base64 and digest',async()=>{
  const {bytes,pack}=largeAssetPack();
  const result=await validateContentPack(pack);
  expect(result.issues).toEqual([]);expect(result.pack).not.toBeNull();
  const asset=result.pack!.assetManifest[0]!;
  expect(asset.bytes).toBe(bytes.length);
  expect(asset.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
  expect(Buffer.from(asset.dataBase64,'base64').equals(bytes)).toBe(true);
});

it.each(['changed-byte','declared-length','noncanonical-base64'] as const)('CS09-03 rejects a resealed large asset with %s without relying on a manifest-digest error',async(kind)=>{
  const {bytes,pack}=largeAssetPack(),asset=pack.assetManifest[0]!;
  if(kind==='changed-byte'){bytes[65536]=99;asset.dataBase64=bytes.toString('base64');}
  else if(kind==='declared-length')asset.bytes+=1;
  else asset.dataBase64='\n'+asset.dataBase64;
  const candidate=sealFixture({...pack});
  const result=await validateContentPack(candidate);
  expect(result.pack).toBeNull();
  expect(result.issues.some(issue=>issue.code==='INVALID_ASSET')).toBe(true);
  expect(result.issues.some(issue=>issue.code==='INTEGRITY_MISMATCH')).toBe(false);
});


// Preservation checks for the public validator, with independent Node encoding/digests.
// These cases must pass before and after the canonical-comparison optimization.
it.each([0,1,2,3,32767,32768,32769,65535,65536,65537])(
  'accepts independent canonical base64 at the %i-byte boundary',
  async(length)=>{
    const bytes=Buffer.alloc(length);
    for(let i=0;i<bytes.length;i++)bytes[i]=(i*73+19)&255;
    const asset={path:'canonical-boundary.bin',provenance:'Synthetic canonical boundary fixture only.',
      bytes:bytes.length,dataBase64:bytes.toString('base64'),
      sha256:createHash('sha256').update(bytes).digest('hex')};
    const result=await validateContentPack(syntheticPack({assetManifest:[asset]}));
    expect(result.issues).toEqual([]);
    expect(result.pack?.assetManifest).toEqual([asset]);
  },
);

const malformedBase64Cases:Array<{name:string;input:string;bytes:number[]}>= [
  {name:'leading-space',input:' AA==',bytes:[0]},
  {name:'trailing-space',input:'AA== ',bytes:[0]},
  {name:'internal-space',input:'A A==',bytes:[0]},
  {name:'internal-tab',input:'A\tA==',bytes:[0]},
  {name:'newline',input:'AA==\n',bytes:[0]},
  {name:'crlf',input:'AA==\r\n',bytes:[0]},
  {name:'missing-two-padding',input:'AA',bytes:[0]},
  {name:'missing-one-padding',input:'AAA',bytes:[0,0]},
  {name:'nonzero-one-byte-pad-bits',input:'AB==',bytes:[0]},
  {name:'nonzero-two-byte-pad-bits',input:'AAB=',bytes:[0,0]},
  {name:'excess-padding',input:'AA===',bytes:[0]},
  {name:'leading-padding',input:'=AAA',bytes:[0,0]},
  {name:'internal-padding',input:'A=A=',bytes:[0]},
  {name:'invalid-character',input:'A#==',bytes:[0]},
  {name:'url-safe-dash',input:'-w==',bytes:[251]},
  {name:'url-safe-underscore',input:'_w==',bytes:[255]},
  {name:'non-binary-character',input:'\u0100A==',bytes:[0]},
  {name:'length-one',input:'A',bytes:[0]},
  {name:'trailing-data',input:'AA==A',bytes:[0]},
  {name:'null-character',input:'AA==\u0000',bytes:[0]},
];

it.each(malformedBase64Cases)(
  'rejects resealed $name at the asset boundary rather than the manifest digest',
  async({input,bytes:values})=>{
    const bytes=Buffer.from(values);
    const candidate=syntheticPack({assetManifest:[{
      path:'malformed-canonical.bin',provenance:'Synthetic noncanonical fixture only.',
      bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),dataBase64:input,
    }]});
    const result=await validateContentPack(candidate);
    expect(result.pack).toBeNull();
    expect(result.issues.map(issue=>issue.code)).toContain('INVALID_ASSET');
    expect(result.issues.map(issue=>issue.code)).not.toContain('INTEGRITY_MISMATCH');
  },
);
