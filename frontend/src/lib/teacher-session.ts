const encoder = new TextEncoder();

const arrayBufferToBase64Url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  const base64 = typeof Buffer !== 'undefined'
    ? Buffer.from(binary, 'binary').toString('base64')
    : btoa(binary);

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const createTeacherSessionToken = async (password: string, secret: string) => {
  const data = encoder.encode(`${password}:${secret}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64Url(hash);
};
