"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function IntroSplash({ variant }: Readonly<{ variant: "client" | "admin" }>) {
  const [isVisible, setIsVisible] = useState(() => {
    const key = `hasSeenIntro_${variant}`;
    try { return !window.sessionStorage.getItem(key); } catch { return true; }
  });
  useEffect(() => {
    if (!isVisible) return;
    const key = `hasSeenIntro_${variant}`;
    const t = setTimeout(() => {
      setIsVisible(false);
      try { window.sessionStorage.setItem(key, "1"); } catch {}
    }, 3000);
    return () => { clearTimeout(t); };
  }, [variant, isVisible]);

  const src = variant === "admin" ? "/logo_admin.svg" : "/logo.svg";
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.img
            layoutId="brand-logo"
            src={src}
            alt="Logo"
            initial={{ scale: 0.9, filter: "brightness(1) drop-shadow(0 0 0px #C5A059)" }}
            animate={{
              scale: [0.9, 1.05, 1],
              filter: [
                "brightness(1) drop-shadow(0 0 0px #C5A059)",
                "brightness(1.3) drop-shadow(0 0 25px #C5A059)",
                "brightness(1) drop-shadow(0 0 0px #C5A059)",
              ],
            }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
            className="w-48 h-48"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
