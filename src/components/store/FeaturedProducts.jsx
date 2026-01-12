"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export default function FeaturedProducts({ products = [] }) {
  if (!products.length) return null;

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-wide mb-8 text-center">
        Featured Products
      </h2>

      <Swiper
        modules={[Autoplay, Navigation]}
        spaceBetween={20}
        slidesPerView={2}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        navigation
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }}
      >
        {products.map((p) => {
          const hasDiscount =
            p.mrp && p.mrp > p.price;

          const discountPercent = hasDiscount
            ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
            : 0;

          return (
            <SwiperSlide key={p._id}>
              <Link
                href={`/product/${p.slug}`}
                className="group block border rounded-lg overflow-hidden hover:shadow-lg transition bg-white relative"
              >
                {/* DISCOUNT BADGE */}
                {hasDiscount && (
                  <span className="absolute top-2 left-2 bg-brand text-white text-xs font-semibold px-2 py-1 rounded z-10">
                    {discountPercent}% OFF
                  </span>
                )}

                <img
                  src={p.images?.[0]}
                  alt={p.name}
                  className="h-64 w-full object-cover"
                />

                <div className="p-3">
                  <h3 className="text-sm font-medium truncate">
                    {p.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-semibold text-black">
                      ₹{p.price}
                    </span>

                    {hasDiscount && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{p.mrp}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
