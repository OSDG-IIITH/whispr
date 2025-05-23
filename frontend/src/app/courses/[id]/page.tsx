"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Users, BookOpen, Calendar, Plus, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";

const mockCourse = {
  id: "1",
  code: "CS101",
  name: "Computer Networks",
  credits: 3,
  description: "Introduction to computer networks covering fundamental concepts of networking protocols, distributed systems, and network security. Students will learn about TCP/IP, HTTP, DNS, routing algorithms, and modern network architectures.",
  averageRating: 4.2,
  reviewCount: 45,
  semester: "MONSOON",
  year: 2024,
  officialDocumentUrl: "https://example.com/cs101-syllabus.pdf",
  instructors: [
    { name: "Dr. Network Expert", lab: "Networking Lab" },
    { name: "Prof. Protocol Master", lab: "Systems Lab" }
  ]
};

const mockReviews = [
  {
    id: "1",
    author: {
      username: "network_ninja",
      echoes: 234,
      isVerified: true
    },
    content: "Excellent course! The professor explains networking concepts very clearly. The assignments are practical and help you understand how protocols actually work. Highly recommend for anyone interested in systems.",
    rating: 5,
    upvotes: 28,
    downvotes: 2,
    replyCount: 8,
    createdAt: "2024-01-20T10:30:00Z",
    isEdited: false,
    userVote: null
  },
  {
    id: "2",
    author: {
      username: "code_student",
      echoes: 89,
      isVerified: true
    },
    content: "Good course content but the pace is quite fast. Make sure you have solid programming fundamentals before taking this. The projects are interesting though - you'll build a mini web server!",
    rating: 4,
    upvotes: 15,
    downvotes: 1,
    replyCount: 3,
    createdAt: "2024-01-19T15:45:00Z",
    isEdited: false,
    userVote: "up" as const
  }
];

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState(mockReviews);
  const [sortBy, setSortBy] = useState("newest");

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    console.log(`Voting ${type} on review ${reviewId}`);
  };

  const handleReply = (reviewId: string) => {
    console.log(`Replying to review ${reviewId}`);
  };

  const handleSubmitReview = async (data: { content: string; rating: number }) => {
    console.log("Submitting review:", data);
    setShowReviewForm(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-secondary'
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
          Back to Courses
        </motion.button>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-xl p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-primary">{mockCourse.code}</h1>
                <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                  {mockCourse.credits} Credits
                </span>
              </div>
              <h2 className="text-2xl font-semibold mb-4">{mockCourse.name}</h2>
              <p className="text-secondary leading-relaxed">{mockCourse.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {renderStars(mockCourse.averageRating)}
              </div>
              <span className="font-semibold">{mockCourse.averageRating.toFixed(1)}</span>
              <span className="text-secondary">({mockCourse.reviewCount} reviews)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              <span>{mockCourse.semester} {mockCourse.year}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-secondary" />
              <a 
                href={mockCourse.officialDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Course Syllabus
              </a>
            </div>
          </div>

          {/* Instructors */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Instructors</h3>
            <div className="flex flex-wrap gap-2">
              {mockCourse.instructors.map((instructor, index) => (
                <div key={index} className="bg-muted px-3 py-2 rounded-lg">
                  <div className="font-medium">{instructor.name}</div>
                  <div className="text-sm text-secondary">{instructor.lab}</div>
                </div>
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
              Write Review
            </button>
            <button className="btn btn-secondary px-6 py-3">
              View Professors
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
              placeholder={`Share your experience with ${mockCourse.name}...`}
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
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    sortBy === option
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
            emptyMessage={`No reviews yet for ${mockCourse.name}. Be the first to share your experience!`}
          />
        </motion.div>
      </div>
    </div>
  );
}