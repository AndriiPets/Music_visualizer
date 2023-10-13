export function dataUrlToBytes(dataUrl) {
  const BASE64_MARKER = ";base64,";
  const base64Index = dataUrl.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  const base64 = dataUrl.substring(base64Index);
  const raw = window.atob(base64);
  const rawLength = raw.length;
  let array = new Uint8Array(new ArrayBuffer(rawLength));

  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}
