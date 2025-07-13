"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Users, GraduationCap, Plus, ArrowLeft, ExternalLink } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { voteAPI, replyAPI, Vote } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/providers/AuthProvider";

const mockProfessor = {
  id: "1",
  name: "Dr. Network Expert",
  lab: "Networking Lab",
  averageRating: 4.5,
  reviewCount: 34,
  courses: [
    { code: "CS101", name: "Computer Networks", semester: "MONSOON 2024" },
    { code: "CS301", name: "Advanced Networking", semester: "SPRING 2024" },
    { code: "CS501", name: "Network Security", semester: "MONSOON 2023" }
  ],
  researchAreas: ["Computer Networks", "Distributed Systems", "IoT", "Network Security"],
  socialMedia: [
    { platform: "Google Scholar", url: "https://scholar.google.com/citations?user=example" },
    { platform: "LinkedIn", url: "https://linkedin.com/in/example" },
    { platform: "Personal Website", url: "https://example.com" }
  ],
  bio: "Dr. Network Expert is a leading researcher in computer networks and distributed systems. With over 10 years of experience in academia and industry, they have published numerous papers in top-tier conferences and journals."
};

const mockReviews = [
  {
    id: "1",
    author: {
      username: "grateful_student",
      echoes: 156,
      isVerified: true
    },
    content: "Absolutely fantastic professor! Dr. Expert has a unique ability to make complex networking concepts easy to understand. Their lectures are engaging and the assignments are challenging but fair. Always available for help during office hours.",
    rating: 5,
    upvotes: 32,
    downvotes: 1,
    replyCount: 12,
    createdAt: "2024-01-20T10:30:00Z",
    isEdited: false,
    userVote: null
  },
  {
    id: "2",
    author: {
      username: "systems_student",
      echoes: 78,
      isVerified: true
    },
    content: "Great teaching style and very knowledgeable. The course was well-structured and I learned a lot. However, the exams can be quite challenging, so make sure to keep up with the material throughout the semester.",
    rating: 4,
    upvotes: 18,
    downvotes: 2,
    replyCount: 5,
    createdAt: "2024-01-18T14:22:00Z",
    isEdited: false,
    userVote: "up" as const
  }
];

export default function ProfessorPage() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState(mockReviews);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  // Fetch user votes when component mounts
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (user) {
        try {
          const votes = await voteAPI.getMyVotes();
          setUserVotes(votes);
        } catch (err) {
          console.error("Error fetching user votes:", err);
        }
      }
    };
    
    fetchUserVotes();
  }, [user]);

  // Helper function to get user's vote for a specific review
  const getUserVoteForReview = (reviewId: string): "up" | "down" | null => {
    const userVote = userVotes.find(vote => vote.review_id === reviewId);
    if (!userVote) return null;
    return userVote.vote_type ? "up" : "down";
  };

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    if (!user) {
      showError("Please log in to vote");
      return;
    }

    try {
      await voteAPI.createVote({
        review_id: reviewId,
        vote_type: type === "up",
      });
      
      // Refresh user votes to show updated state
      try {
        const votes = await voteAPI.getMyVotes();
        setUserVotes(votes);
      } catch (err) {
        console.error("Error refreshing user votes:", err);
      }
      
      showSuccess(`${type === "up" ? "Upvoted" : "Downvoted"} review!`);
    } catch (err: any) {
      console.error("Error voting on review:", err);
      showError(err.message || "Failed to vote. Please try again.");
    }
  };

  const handleReply = async (reviewId: string, content: string) => {
    if (!user) {
      showError("Please log in to reply");
      return;
    }

    try {
      await replyAPI.createReply({
        review_id: reviewId,
        content: content,
      });
      
      // Note: You'll need to implement review refresh similar to other pages
      showSuccess("Reply submitted successfully!");
    } catch (err: any) {
      console.error("Error creating reply:", err);
      showError(err.message || "Failed to create reply. Please try again.");
    }
  };

  const handleSubmitReview = async (data: { content: string; rating: number }) => {
    console.log("Submitting review:", data);
    setShowReviewForm(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-secondary'
          }`}
      />
    ));
  };

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
          Back to Professors
        </motion.button>

        {/* Professor Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-xl p-8 mb-8"
        >
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-green-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{mockProfessor.name}</h1>
              <p className="text-primary text-lg mb-4">{mockProfessor.lab}</p>
              <p className="text-secondary leading-relaxed">{mockProfessor.bio}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {renderStars(mockProfessor.averageRating)}
              </div>
              <span className="font-semibold text-lg">{mockProfessor.averageRating.toFixed(1)}</span>
              <span className="text-secondary">({mockProfessor.reviewCount} reviews)</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              <span>{mockProfessor.courses.length} courses taught</span>
            </div>
          </div>

          {/* Research Areas */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Research Areas</h3>
            <div className="flex flex-wrap gap-2">
              {mockProfessor.researchAreas.map((area, index) => (
                <span key={index} className="bg-primary/10 text-primary px-3 py-2 rounded-lg">
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Courses Taught</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {mockProfessor.courses.map((course, index) => (
                <div key={index} className="bg-muted p-4 rounded-lg">
                  <div className="font-medium text-primary">{course.code}</div>
                  <div className="font-medium">{course.name}</div>
                  <div className="text-sm text-secondary">{course.semester}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Links</h3>
            <div className="flex flex-wrap gap-3">
              {mockProfessor.socialMedia.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {link.platform}
                </a>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn btn-primary px-6 py-3 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Rate & Review
            </button>
            <button className="btn btn-secondary px-6 py-3">
              View Courses
            </button>
          </div>
        </motion.div>

        {/* Review Form */}
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <ReviewForm
              onSubmit={handleSubmitReview}
              onCancel={() => setShowReviewForm(false)}
              placeholder={`Share your experience with ${mockProfessor.name}...`}
              title="Review Professor"
            />
          </motion.div>
        )}

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Reviews ({reviews.length})</h3>

            <div className="flex items-center gap-2">
              <span className="text-secondary">Sort:</span>
              {["newest", "oldest", "rating", "helpful"].map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${sortBy === option
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
            reviews={reviews.map(review => ({
              ...review,
              userVote: getUserVoteForReview(review.id)
            }))}
            onVote={handleVote}
            onReply={handleReply}
            emptyMessage={`No reviews yet for ${mockProfessor.name}. Be the first to share your experience!`}
          />
        </motion.div>
      </div>
    </div>
  );
}