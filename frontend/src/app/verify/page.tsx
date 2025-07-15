"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { verificationAPI } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import Loader from "@/components/common/Loader";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "initiate"
  >("loading");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"disclaimer" | "redirect">("disclaimer");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      setStatus("success");
      setMessage(
        "Your account has been successfully verified! You can now post reviews and vote."
      );

      // Refresh user data to get updated verification status
      refresh();

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } else if (error) {
      setStatus("error");
      switch (error) {
        case "invalid_session":
          setMessage("Invalid verification session. Please try again.");
          break;
        case "session_expired":
          setMessage("Verification session expired. Please try again.");
          break;
        case "cas_validation_failed":
          setMessage("CAS validation failed. Please try again.");
          break;
        case "email_already_used":
          setMessage(
            "This email has already been used to verify another account."
          );
          break;
        case "internal_error":
          setMessage("An internal error occurred. Please try again later.");
          break;
        default:
          setMessage("Verification failed. Please try again.");
      }
    } else {
      setStatus("initiate");
    }
  }, [searchParams, router, refresh]);

  const handleInitiateVerification = async () => {
    if (step === "disclaimer" && agreed) {
      setStep("redirect");
    } else if (step === "redirect") {
      try {
        setStatus("loading");
        setMessage("Initiating verification...");

        // Call backend API to initiate verification
        const response = await verificationAPI.initiate();
        const { cas_url } = response;

        // Redirect to CAS login
        window.location.href = cas_url;
      } catch (error: unknown) {
        console.error("Verification initiation failed:", error);
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Failed to initiate verification. Please try again."
        );
      }
    }
  };

  const renderContent = () => {
    switch (status) {
      case "success":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">
              Verification Successful!
            </h1>
            <p className="text-secondary mb-6">{message}</p>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-primary">
                Redirecting to dashboard in 3 seconds...
              </p>
            </div>
          </motion.div>
        );

      case "error":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Verification Failed</h1>
            <p className="text-secondary mb-6">{message}</p>
            <button
              onClick={() => {
                setStatus("initiate");
                setStep("disclaimer");
                setAgreed(false);
              }}
              className="btn btn-primary w-24 h-8"
            >
              Try Again
            </button>
          </motion.div>
        );

      case "initiate":
        return (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Student Verification</h1>
              <p className="text-secondary">
                Verify your IIITH student status to unlock full platform access
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === "disclaimer" && (
                <motion.div
                  key="disclaimer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-primary/10 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Privacy First
                    </h3>
                    <ul className="space-y-3 text-sm text-secondary">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>
                          We use CAS only to verify you&apos;re a real IIITH
                          student
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>
                          Your email is NEVER linked to your Whispr account
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Each email can only verify one account</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Complete anonymity is guaranteed</span>
                      </li>
                    </ul>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                    />
                    <span className="text-sm">
                      I understand and agree to the verification process
                    </span>
                  </label>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="btn btn-secondary px-6 py-3"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInitiateVerification}
                      disabled={!agreed}
                      className="btn btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "redirect" && (
                <motion.div
                  key="redirect"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ExternalLink className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Ready to Verify</h3>
                    <p className="text-sm text-secondary">
                      You&apos;ll be redirected to IIITH CAS login.
                      <br />
                      After verification, you&apos;ll return here automatically.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setStep("disclaimer")}
                      className="btn btn-secondary px-6 py-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleInitiateVerification}
                      className="btn btn-primary px-6 py-3"
                    >
                      Proceed to CAS
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <Loader className="mx-auto mb-4" />
            <p className="text-secondary">Loading...</p>
          </div>
        );
    }
  };

  return (
    <Suspense>
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-primary/5 to-black" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-2xl"
        >
          <div className="card p-8 bg-card/50 backdrop-blur-xl border-primary/20">
            {renderContent()}
          </div>
        </motion.div>
      </div>
    </Suspense>
  );
}
