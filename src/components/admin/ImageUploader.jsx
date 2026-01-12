"use client";

export default function ImageUploader({ onUpload }) {
  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 1️⃣ Get signature from backend
    const signRes = await fetch("/api/admin/cloudinary-sign");
    const signData = await signRes.json();

    if (!signRes.ok) {
      alert("Not authorized");
      return;
    }

    // 2️⃣ Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signData.apiKey);
    formData.append("timestamp", signData.timestamp);
    formData.append("signature", signData.signature);
    formData.append("folder", signData.folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await uploadRes.json();

    if (data.secure_url) {
      onUpload(data.secure_url);
    } else {
      alert("Upload failed");
    }
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleUpload}
    />
  );
}
