"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function BrandHeader() {
  return (
    <div className="w-full h-20 bg-[#0a0a0a] border-b border-[#C5A059] flex items-center justify-center sticky top-0 z-50">
      <Link href="/" className="flex items-center justify-center gap-4">
        <motion.div layoutId="brand-logo">
          <Image
            src="/logo.png"
            alt="Barber Shop Brienz Logo"
            width={300}
            height={100}
            priority
            className="h-10 w-auto object-contain"
          />
        </motion.div>
        <span className="text-[#C5A059] font-serif text-lg md:text-xl font-bold tracking-widest uppercase whitespace-nowrap">
          Barber Shop - Brienz
        </span>
      </Link>
    </div>
  );
}
