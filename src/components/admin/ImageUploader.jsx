"use client";

export default function ImageUploader({ onUpload, folder = "" }) {
  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ signature API with folder support
    const signRes = await fetch(
      `/api/admin/cloudinary-sign?folder=${encodeURIComponent(folder)}`
    );
    const signData = await signRes.json();

    if (!signRes.ok) {
      alert(signData?.message || "Not authorized");
      return;
    }

    // Upload to Cloudinary
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

    // ✅ reset input
    e.target.value = "";
  }

  return <input type="file" accept="image/*" onChange={handleUpload} />;
}
