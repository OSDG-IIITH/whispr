"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";
import Loader from "./Loader";

interface KillSwitchProps {
  onConfirm: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function KillSwitch({ onConfirm, isOpen, onClose }: KillSwitchProps) {
  const [switchPosition, setSwitchPosition] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== "DELETE" || !switchPosition) return;

    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
      setSwitchPosition(false);
      setConfirmText("");
    }
  };

  const canProceed = switchPosition && confirmText === "DELETE";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-card border border-red-500/50 rounded-xl p-6 w-full max-w-md shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-red-400">
                    Kill Switch
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-secondary hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warning */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  PERMANENT ACTION
                </h3>
                <p className="text-sm text-red-300 mb-3">
                  This will permanently delete your account and ALL your data:
                </p>
                <ul className="text-sm text-red-300 space-y-1">
                  <li>• All your reviews and replies</li>
                  <li>• Your profile and rank progress</li>
                  <li>• All votes and interactions</li>
                  <li>• Cannot be undone - You can NEVER create an account again with your IIIT email, if you have linked it.</li>
                </ul>
              </div>

              {/* Physical Switch */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  Activate Kill Switch
                </label>
                <div
                  className={`
                    relative w-16 h-8 rounded-full cursor-pointer transition-colors
                    ${switchPosition ? "bg-red-500" : "bg-muted"}
                  `}
                  onClick={() => setSwitchPosition(!switchPosition)}
                >
                  <motion.div
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    animate={{
                      x: switchPosition ? 36 : 4,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>

              {/* Confirmation Text */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Type &quot;DELETE&quot; to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-muted text-foreground py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canProceed || isDeleting}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader size="sm" className="!w-4 !h-4" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
