"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Hero({ banners = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!banners.length) return;

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  const banner = banners[index];

  return (
    <div className="relative w-full h-[60vh] overflow-hidden">
      <img
        src={banner.image}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        alt=""
      />

      {banner.link && (
        <Link
          href={banner.link}
          className="absolute inset-0"
        />
      )}

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full ${
              i === index
                ? "bg-white"
                : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
