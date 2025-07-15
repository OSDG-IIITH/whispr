"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import Loader from "@/components/common/Loader";
import { ProfilesClientContent } from "./ProfilesClientContent";

export default function ProfilesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-primary/5 to-black" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-2xl"
          >
            <div className="card p-8 bg-card/50 backdrop-blur-xl border-primary/20 text-center">
              <Loader className="mx-auto mb-4" />
              <p className="text-secondary">Loading profiles page...</p>
            </div>
          </motion.div>
        </div>
      }
    >
      <ProfilesClientContent />
    </Suspense>
  );
}