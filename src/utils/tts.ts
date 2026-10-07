export function getTtsUrl(text: string, gender: 'female' | 'male' = 'female') {
  try {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text.trim());
    let t = "";
    for (let i = 0; i < encoded.length; i++) {
      t += String.fromCharCode(encoded[i]);
    }
    const b64 = btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `https://thocodehoctiengnhat.com/uploads/tts/zh/${b64}-${gender}.mp3`;
  } catch (e) {
    return `/api/tts?text=${encodeURIComponent(text)}`;
  }
}
