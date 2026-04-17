"use client";

import Image from "next/image";
import { Ad } from "../lib/ads";

interface AdSlotProps {
  ad: Ad;
}

export default function AdSlot({ ad }: AdSlotProps) {
  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex bg-surface-container-high rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] group relative border-2 ${
        ad.isPremium ? "border-primary/30" : "border-transparent"
      }`}
    >
      <div className="w-[120px] h-[120px] flex-shrink-0 relative overflow-hidden bg-surface-container-highest">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          sizes="120px"
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 bg-foreground/70 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-widest flex items-center gap-1">
          AD
        </div>
      </div>

      <div className="flex flex-col justify-between p-4 flex-grow overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-secondary uppercase tracking-tighter">
              {ad.category}
            </span>
          </div>
          <h3 className="text-[16px] font-black text-foreground leading-snug truncate font-display mb-1">
            {ad.title}
          </h3>
          <p className="text-[12px] text-foreground/60 leading-relaxed line-clamp-2">
            {ad.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] font-bold text-primary group-hover:underline">
            자세히 보기 →
          </span>
          {ad.isPremium && (
            <span className="text-[10px] italic text-primary/50">Sponsored</span>
          )}
        </div>
      </div>
      
      {/* Premium Badge Glow */}
      {ad.isPremium && (
        <div className="absolute -inset-1 bg-primary/5 blur-xl -z-10 group-hover:bg-primary/10 transition-colors" />
      )}
    </a>
  );
}
