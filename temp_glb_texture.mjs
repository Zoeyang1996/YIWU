import { readFileSync, writeFileSync } from 'node:fs';

const files = [
  ['NEW1017/shiji_modle/tripo_convert_6263df92-710a-4d5f-9fbb-aa1c83ec2b91.glb', 'glb-tex-a.jpg'],
  ['NEW1017/shiji_modle/tripo_convert_96db579d-e668-4a52-a7c1-05fbb8853c0b.glb', 'glb-tex-b.jpg'],
];

for (const [file, out] of files) {
  const buffer = readFileSync(file);
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'));
  const binStart = 20 + jsonLength + 8;
  const image = json.images[0];
  const view = json.bufferViews[image.bufferView];
  const offset = binStart + (view.byteOffset ?? 0);
  const bytes = buffer.subarray(offset, offset + view.byteLength);
  writeFileSync(out, bytes);
  console.log(out, bytes.length, 'bytes');
}
