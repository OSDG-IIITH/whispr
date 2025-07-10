"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MessageSquare, TrendingUp, Settings, Flag, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user/UserAvatar";
import { RankBadge } from "@/components/user/RankBadge";
import { EchoesDisplay } from "@/components/user/EchoesDisplay";
import { ReviewList } from "@/components/reviews/ReviewList";
import { KillSwitch } from "@/components/common/KillSwitch";
import { formatDate } from "@/lib/utils";

const mockUser = {
  id: "1",
  username: "anonymous_whisperer",
  bio: "Just sharing my honest thoughts about courses and professors. Love helping fellow students make informed decisions! 🎓",
  studentSinceYear: 2022,
  echoes: 450,
  isVerified: true,
  isOwn: true, // This would be determined by comparing with current user
  joinDate: "2023-01-15T00:00:00Z",
  avatarUrl: undefined,
  stats: {
    reviewCount: 24,
    upvotesReceived: 156,
    profileViews: 89,
    followersCount: 12,
    followingCount: 8
  }
};

const mockReviews = [
  {
    id: "1",
    author: {
      username: "anonymous_whisperer",
      echoes: 450,
      isVerified: true
    },
    content: "Computer Networks was an amazing course! Prof really knows how to explain complex topics. The assignments are challenging but you learn a lot. Definitely recommend if you're interested in systems.",
    rating: 5,
    upvotes: 28,
    downvotes: 2,
    replyCount: 8,
    createdAt: "2024-01-20T10:30:00Z",
    isEdited: false,
    userVote: null,
    isOwn: true
  },
  {
    id: "2",
    author: {
      username: "anonymous_whisperer",
      echoes: 450,
      isVerified: true
    },
    content: "Data Structures course is well-structured but moves quite fast. Make sure you have good programming fundamentals before taking this. The projects are interesting though!",
    rating: 4,
    upvotes: 15,
    downvotes: 1,
    replyCount: 3,
    createdAt: "2024-01-18T15:45:00Z",
    isEdited: true,
    userVote: null,
    isOwn: true
  }
];

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [reviews, setReviews] = useState(mockReviews);
  const [showKillSwitch, setShowKillSwitch] = useState(false);
  const [filterBy, setFilterBy] = useState("all");

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    console.log(`Voting ${type} on review ${reviewId}`);
  };

  const handleReply = (reviewId: string) => {
    console.log(`Replying to review ${reviewId}`);
  };

  const handleEdit = (reviewId: string) => {
    console.log(`Editing review ${reviewId}`);
  };

  const handleDelete = (reviewId: string) => {
    console.log(`Deleting review ${reviewId}`);
  };

  const handleReport = (reviewId: string) => {
    console.log(`Reporting review ${reviewId}`);
  };

  const handleKillSwitch = async () => {
    console.log("Activating kill switch - deleting account");
    // TODO: Implement account deletion
  };

  const stats = [
    {
      label: "Reviews",
      value: mockUser.stats.reviewCount,
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />
    },
    {
      label: "Upvotes",
      value: mockUser.stats.upvotesReceived,
      icon: <TrendingUp className="w-5 h-5 text-green-500" />
    },
    {
      label: "Profile Views",
      value: mockUser.stats.profileViews,
      icon: <Settings className="w-5 h-5 text-purple-500" />
    },
    {
      label: "Followers",
      value: mockUser.stats.followersCount,
      icon: <Calendar className="w-5 h-5 text-yellow-500" />
    }
  ];

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

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-xl p-8 mb-8"
        >
          <div className="flex items-start gap-6 mb-6">
            <UserAvatar
              username={mockUser.username}
              echoes={mockUser.echoes}
              size="xl"
              avatarUrl={mockUser.avatarUrl}
            />

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{mockUser.username}</h1>
                {mockUser.isVerified && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-black text-sm">✓</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <RankBadge echoes={mockUser.echoes} size="lg" showProgress />
              </div>

              <div className="mb-4">
                <EchoesDisplay echoes={mockUser.echoes} recentChange={+12} size="lg" />
              </div>

              {mockUser.bio && (
                <p className="text-secondary leading-relaxed mb-4">{mockUser.bio}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-secondary">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Student since {mockUser.studentSinceYear}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Joined {formatDate(mockUser.joinDate)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {mockUser.isOwn ? (
                <>
                  <button className="btn btn-secondary px-4 py-2 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowKillSwitch(true)}
                    className="btn text-red-400 border-red-400/50 hover:bg-red-400/10 px-4 py-2 text-sm"
                  >
                    Kill Switch
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary px-4 py-2">
                    Follow
                  </button>
                  <button className="btn btn-secondary px-4 py-2 flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-muted/50 rounded-lg p-4 text-center"
              >
                <div className="flex justify-center mb-2">
                  {stat.icon}
                </div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-sm text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Reviews ({reviews.length})</h3>

            <div className="flex items-center gap-2">
              <span className="text-secondary">Filter:</span>
              {["all", "courses", "professors"].map((option) => (
                <button
                  key={option}
                  onClick={() => setFilterBy(option)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filterBy === option
                    ? 'bg-primary text-black'
                    : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
                    }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <ReviewList
            reviews={reviews}
            onVote={handleVote}
            onReply={handleReply}
            onEdit={mockUser.isOwn ? handleEdit : undefined}
            onDelete={mockUser.isOwn ? handleDelete : undefined}
            onReport={!mockUser.isOwn ? handleReport : undefined}
            emptyMessage={`${mockUser.username} hasn't written any reviews yet.`}
          />
        </motion.div>

        {/* Kill Switch Modal */}
        <KillSwitch
          isOpen={showKillSwitch}
          onClose={() => setShowKillSwitch(false)}
          onConfirm={handleKillSwitch}
        />
      </div>
    </div>
  );
}