"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Shield, Eye, UserCheck, Lock, Database, Mail, Users, MessageSquare, Search } from "lucide-react";
import Link from "next/link";

export default function AnonymityPage() {
    return (
        <div className="relative min-h-screen">
            <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-black via-primary/5 to-black" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl font-bold">Anonymity & Privacy</h1>
                    </div>
                    <p className="text-secondary text-lg">
                        Understanding how Whispr protects your identity and maintains your privacy
                    </p>
                </motion.div>

                {/* Main Content */}
                <div className="space-y-8">
                    {/* Overview */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6"
                    >
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Eye className="w-6 h-6 text-primary" />
                            Privacy-First Design
                        </h2>
                        <p className="text-secondary mb-4">
                            Whispr is built from the ground up with anonymity and privacy as core principles.
                            Our system is designed to protect your identity while enabling authentic student feedback.
                        </p>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                            <p className="text-sm">
                                <strong className="text-primary">Key Principle:</strong> We believe in the power of honest feedback
                                without fear of retaliation. Your identity remains protected while contributing to the academic community.
                            </p>
                        </div>
                    </motion.section>

                    {/* Account Creation */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6"
                    >
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            Anonymous Account Creation
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                <h3 className="font-semibold text-green-400 mb-2">✓ What You Can Do</h3>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• Create an account with just a username and password</li>
                                    <li>• No email required for registration</li>
                                    <li>• Choose any anonymous username you prefer</li>
                                    <li>• Start browsing immediately after registration</li>
                                </ul>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                <h3 className="font-semibold text-yellow-400 mb-2">⚠ Limited Functionality</h3>
                                <p className="text-sm text-secondary mb-2">
                                    Unverified accounts have restricted access to maintain platform quality:
                                </p>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• View courses and professors</li>
                                    <li>• Read existing reviews and discussions</li>
                                    <li>• Browse user profiles (view-only)</li>
                                    <li>• Access general platform information</li>
                                </ul>
                            </div>
                        </div>
                    </motion.section>

                    {/* CAS Verification */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6"
                    >
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <UserCheck className="w-6 h-6 text-primary" />
                            Student Verification via CAS
                        </h2>
                        <div className="space-y-4">
                            <p className="text-secondary">
                                To unlock full platform features, you can verify your student status using the College
                                Authentication Service (CAS) - but your anonymity remains completely protected.
                            </p>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-400 mb-2">How CAS Verification Works</h3>
                                <div className="space-y-3 text-sm text-secondary">
                                    <div className="flex items-start gap-3">
                                        <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                                        <p>You click "Verify with CAS" (optional, only when you want full access)</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                                        <p>You're redirected to the official college authentication system</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                                        <p>CAS confirms you're a valid student (using your college email)</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                                        <p>Your account gets verified, but <strong>no personal information is stored</strong></p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Critical Privacy Protection
                                </h3>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• <strong>No email-to-account mapping:</strong> We never store which email belongs to which username</li>
                                    <li>• <strong>One-time verification:</strong> Your email is only used to confirm student status</li>
                                    <li>• <strong>Immediate disconnection:</strong> Once verified, the email link is permanently severed</li>
                                    <li>• <strong>Duplicate prevention only:</strong> We only track that an email was used, not by whom</li>
                                </ul>
                            </div>
                        </div>
                    </motion.section>

                    {/* Full Access Features */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6"
                    >
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-primary" />
                            Verified User Capabilities
                        </h2>
                        <p className="text-secondary mb-4">
                            Once verified, you unlock the full potential of Whispr while maintaining complete anonymity:
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Search className="w-4 h-4 text-primary" />
                                    Advanced Search
                                </h3>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• Search courses by code, name, or instructor</li>
                                    <li>• Filter professors by department</li>
                                    <li>• Advanced filtering options</li>
                                </ul>
                            </div>

                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    Content Creation
                                </h3>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• Write detailed course reviews</li>
                                    <li>• Rate professors and courses</li>
                                    <li>• Reply to existing reviews</li>
                                </ul>
                            </div>

                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    Social Features
                                </h3>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• Follow other anonymous users</li>
                                    <li>• Upvote/downvote reviews</li>
                                    <li>• Build your reputation through helpful content</li>
                                </ul>
                            </div>

                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-primary" />
                                    Profile Management
                                </h3>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• Customize your anonymous profile</li>
                                    <li>• Track your contributions</li>
                                    <li>• Manage your followed users</li>
                                </ul>
                            </div>
                        </div>
                    </motion.section>

                    {/* Technical Implementation */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6"
                    >
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Database className="w-6 h-6 text-primary" />
                            Technical Privacy Implementation
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-blue-400" />
                                    Email Separation Architecture
                                </h3>
                                <p className="text-sm text-secondary mb-2">
                                    Our database design ensures complete anonymity:
                                </p>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• <strong>User Table:</strong> Contains usernames, passwords, and profile data (no emails)</li>
                                    <li>• <strong>Used Emails Table:</strong> Tracks which emails have been verified (no user links)</li>
                                    <li>• <strong>Zero Cross-Reference:</strong> No database connections between these tables</li>
                                    <li>• <strong>Verification Flag:</strong> Users have a simple "verified" status without email details</li>
                                </ul>
                            </div>

                            <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-green-400" />
                                    Authentication & Security
                                </h3>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• Username-based login (not email-based)</li>
                                    <li>• JWT tokens contain only user ID and verification status</li>
                                    <li>• No personal information in authentication tokens</li>
                                    <li>• Secure HTTP-only cookies for session management</li>
                                </ul>
                            </div>
                        </div>
                    </motion.section>

                    {/* Guarantees */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6"
                    >
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-primary" />
                            Our Privacy Guarantees
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-green-400">✓ What We Promise</h3>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• Complete username anonymity</li>
                                    <li>• No email-to-account traceability</li>
                                    <li>• No personal data storage beyond username</li>
                                    <li>• No tracking of individual verification emails</li>
                                    <li>• Open-source codebase for transparency</li>
                                    <li>• Regular security audits</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-red-400">✗ What We Never Do</h3>
                                <ul className="text-sm space-y-1 text-secondary">
                                    <li>• Store your real name or email with your account</li>
                                    <li>• Create any mapping between emails and usernames</li>
                                    <li>• Share user data with third parties</li>
                                    <li>• Track your browsing patterns</li>
                                    <li>• Require personal information for account use</li>
                                    <li>• Store unnecessary metadata</li>
                                </ul>
                            </div>
                        </div>
                    </motion.section>

                    {/* FAQ */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6"
                    >
                        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>

                        <div className="space-y-4">
                            <div className="border-l-2 border-primary/30 pl-4">
                                <h3 className="font-semibold mb-2">Can my reviews be traced back to me?</h3>
                                <p className="text-sm text-secondary">
                                    No. Your reviews are only associated with your anonymous username. Since we don't store
                                    which email belongs to which username, there's no way to trace reviews to your real identity.
                                </p>
                            </div>

                            <div className="border-l-2 border-primary/30 pl-4">
                                <h3 className="font-semibold mb-2">Why do you need email verification at all?</h3>
                                <p className="text-sm text-secondary">
                                    Email verification ensures only IIITH students can write reviews, maintaining review quality
                                    and authenticity. It also prevents spam and multiple accounts from the same person.
                                </p>
                            </div>

                            <div className="border-l-2 border-primary/30 pl-4">
                                <h3 className="font-semibold mb-2">What happens if I lose access to my account?</h3>
                                <p className="text-sm text-secondary">
                                    Since we don't store your email with your account, account recovery is not possible.
                                    We recommend securely storing your username and password. This is a trade-off for complete anonymity.
                                </p>
                            </div>

                            <div className="border-l-2 border-primary/30 pl-4">
                                <h3 className="font-semibold mb-2">Can I verify multiple accounts with the same email?</h3>
                                <p className="text-sm text-secondary">
                                    No. Each email can only be used once for verification to prevent abuse. However,
                                    we don't track which account was verified with which email.
                                </p>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
}