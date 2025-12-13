"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Download,
  Shield,
  Users,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { FEATURES, RANKS } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-green-900/10 to-black" />
        <div className="absolute inset-0">
          {/* Simple particle effect using CSS */}
          <div className="particles-container">
            {Array.from({ length: 50 }).map((_, i) => (
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

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-2"
            >
              <Image
                src="/whispr/logo.png"
                alt="Whispr Logo"
                width={120}
                height={120}
                className="mx-auto drop-shadow-2xl"
                priority
              />
            </motion.div>

            <h1 className="text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-primary text-glow">
              Whispr
            </h1>
            <div className="text-2xl space-y-2">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="block text-white"
              >
                Speak softly.
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="block text-primary"
              >
                Help loudly.
              </motion.span>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-xl text-secondary mb-8"
          >
            Anonymous reviews for IIITH courses and professors.
            <br />
            Your voice matters, your identity doesn&apos;t.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link href={user ? "/dashboard" : "/auth/register"}>
              <button className="btn btn-primary px-8 py-3 text-lg glow-green">
                {user ? "Go to Dashboard" : "Get Started"}{" "}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </Link>
            <Link href="https://drive.google.com/file/d/1jx2PZRUOXIz2mnGk-_YV8yOljhl0O7j8/view?usp=drivesdk" target="_blank">
              <button className="btn  px-8 py-3 text-lg border border-primary text-primary hover:bg-primary/10">
                Design Doc <Download className="ml-2 h-5 w-5" />
              </button>
            </Link>
          </motion.div>

          {/* Privacy Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="mt-6"
          >
            <Link
              href="/anonymity"
              className="inline-flex items-center gap-2 px-4 py-2 bg-card/30 backdrop-blur-sm border border-primary/30 rounded-lg text-secondary hover:text-primary hover:border-primary/60 hover:bg-card/50 transition-all duration-300 text-sm font-medium"
            >
              <Shield className="w-4 h-4" />
              Learn how we protect your anonymity
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12"
          >
            Why Whispr?
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 h-full bg-card/50 backdrop-blur-xl border-primary/20 hover:border-primary/50 transition-all duration-300"
              >
                <div className="text-4xl mb-4">
                  {React.createElement(feature.icon, { className: "w-8 h-8" })}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-primary/5">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12"
          >
            How It Works
          </motion.h2>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Create Your Anonymous Identity",
                description:
                  "Choose a unique username - no email required for registration",
                icon: <Users className="w-6 h-6" />,
              },
              {
                step: "2",
                title: "Verify Your Student Status",
                description:
                  "Use CAS login once to prove you're from IIITH - we never store your email",
                icon: <Shield className="w-6 h-6" />,
              },
              {
                step: "3",
                title: "Share Your Experience",
                description:
                  "Write honest reviews about courses and professors",
                icon: <MessageSquare className="w-6 h-6" />,
              },
              {
                step: "4",
                title: "Earn Echoes & Climb Ranks",
                description:
                  "Get recognized for helpful contributions without revealing who you are",
                icon: <TrendingUp className="w-6 h-6" />,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-4 items-start"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    {item.icon}
                    {item.title}
                  </h3>
                  <p className="text-secondary">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Learn More About Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="mt-8 text-center"
          >
            <Link
              href="/anonymity"
              className="text-secondary hover:text-primary transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Learn more about how we protect your privacy
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Ranks Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12"
          >
            Climb the Ranks
          </motion.h2>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(RANKS).map(([key, rank], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`card p-6 text-center bg-gradient-to-br ${rank.gradient} border-none`}
              >
                <div className="text-4xl mb-2">{rank.icon}</div>
                <h3 className="font-bold text-lg text-white">{rank.name}</h3>
                <p className="text-sm text-white/80">{rank.min}+ echoes</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-4">
            Ready to Share Your Voice?
          </h2>
          <p className="text-xl text-secondary mb-8">
            Join the community of IIITH students helping each other make
            informed decisions.
          </p>
          <Link href={user ? "/dashboard" : "/auth/register"}>
            <button className="btn btn-primary px-8 py-3 text-lg glow-green">
              {user ? "Go to Dashboard" : "Start Whispering"}{" "}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
