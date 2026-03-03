export const IMGBB_API_KEY = "d685822691566e39accb630d6ef7a6d9";

export async function uploadImageToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (data.success) return data.data.url;
  throw new Error('Image upload failed');
}
