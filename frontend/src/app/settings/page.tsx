"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Shield, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { UserAvatar } from "@/components/user/UserAvatar";
import { RankBadge } from "@/components/user/RankBadge";
import { EchoesDisplay } from "@/components/user/EchoesDisplay";
import { userAPI } from "@/lib/api";

export default function SettingsPage() {
    const router = useRouter();
    const { user, refresh } = useAuth();
    const { showSuccess, showError } = useToast();
    const [saveLoading, setSaveLoading] = useState(false);
    const [formData, setFormData] = useState({
        bio: "",
        studentSinceYear: new Date().getFullYear(),
        username: ""
    });

    // Initialize form data when user loads
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                bio: user.bio || "",
                studentSinceYear: user.student_since_year || new Date().getFullYear(),
                username: user.username || ""
            }));
        }
    }, [user]);

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            const updateData: {
                bio: string;
                student_since_year: number;
                username: string;
            } = {
                bio: formData.bio,
                student_since_year: formData.studentSinceYear,
                username: formData.username
            };

            await userAPI.updateUser(updateData);

            // Refresh user data
            await refresh();

            showSuccess("Settings saved successfully");
        } catch (error) {
            console.error("Failed to save settings:", error);
            showError("Failed to save settings. Please try again.");
        } finally {
            setSaveLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black pb-24">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </motion.button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-secondary">Manage your account preferences</p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-primary/20 rounded-xl p-6 sticky top-8"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <UserAvatar
                                    username={user.username}
                                    echoes={user.echoes}
                                    size="lg"
                                />
                                <div className="flex-1">
                                    <h3 className="font-semibold">{user.username}</h3>
                                    <RankBadge echoes={user.echoes} size="sm" />
                                </div>
                            </div>

                            <div className="mb-4">
                                <EchoesDisplay echoes={user.echoes} />
                            </div>

                            <div className="space-y-2 text-sm text-secondary">
                                <div>Member since {new Date(user.created_at).getFullYear()}</div>
                                {user.is_muffled && !user.is_banned && (
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <Shield className="w-4 h-4" />
                                        <span>Account verification required</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Settings */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card border border-primary/20 rounded-xl p-6"
                        >
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Profile Settings
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="Enter username..."
                                        className="w-full bg-muted border border-border rounded-lg p-3 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Bio</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Tell others about yourself..."
                                        className="w-full bg-muted border border-border rounded-lg p-3 text-sm resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Student Since Year</label>
                                    <input
                                        type="number"
                                        value={formData.studentSinceYear}
                                        onChange={(e) => setFormData({ ...formData, studentSinceYear: parseInt(e.target.value) })}
                                        className="w-full bg-muted border border-border rounded-lg p-3 text-sm"
                                        min={2000}
                                        max={new Date().getFullYear()}
                                    />
                                </div>

                            </div>
                        </motion.div>

                        {/* Save Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex justify-end"
                        >
                            <button
                                onClick={handleSave}
                                disabled={saveLoading}
                                className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saveLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
} 