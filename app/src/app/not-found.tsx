"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Home, Search, ArrowLeft, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-green-900/10 to-black" />
      <div className="absolute inset-0">
        {/* Particle effect */}
        <div className="particles-container">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `pulse ${2 + Math.random() * 2}s infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Number */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary text-glow mb-4">
              404
            </h1>
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <AlertTriangle className="w-6 h-6" />
              <span className="text-xl font-semibold">Page Not Found</span>
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <p className="text-xl text-secondary mb-4">
              Oops! The page you&apos;re looking for seems to have whispered away.
            </p>
            <p className="text-lg text-secondary">
              Don&apos;t worry, you can always find your way back to the main conversation.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link href="/">
              <button className="btn btn-primary px-8 py-3 text-lg glow-green">
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </button>
            </Link>
            <Link href="/search">
              <button className="btn px-8 py-3 text-lg border border-primary text-primary hover:bg-primary/10">
                <Search className="mr-2 h-5 w-5" />
                Search
              </button>
            </Link>
          </motion.div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8"
          >
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12"
          >
            <div className="flex justify-center gap-8 opacity-30">
              <div className="w-16 h-16 border border-primary/30 rounded-full flex items-center justify-center">
                <span className="text-primary text-sm">404</span>
              </div>
              <div className="w-12 h-12 border border-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary text-xs">404</span>
              </div>
              <div className="w-8 h-8 border border-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary text-xs">404</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 