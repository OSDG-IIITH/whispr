/*
 * This file contains interfaces for the frontend components.
 * These are derived from backend models but adapted to match how they're used in the frontend.
 */

import {
  User,
  Notification,
  Course,
  CourseInstructor,
  Professor,
  Review,
  Reply,
  Vote,
} from "./backend-models";

export interface FrontendUser extends User {
  isVerified: boolean; // Derived from is_muffled (inverse of is_muffled)
  isFollowing?: boolean; // Whether current user is following this user
}

export interface FrontendNotification extends Omit<Notification, "is_read"> {
  is_read: boolean;
  read: boolean; // Required in frontend - an alias for is_read
}

export interface FrontendCourse extends Omit<Course, "average_rating"> {
  average_rating: string | number; // Can be either string from API or number in frontend
}

export interface FrontendProfessor extends Omit<Professor, "average_rating"> {
  average_rating: string | number; // Can be either string from API or number in frontend
}

export interface FrontendCourseInstructor
  extends Omit<CourseInstructor, "average_rating"> {
  average_rating: string | number; // Can be either string from API or number in frontend
}

export interface FrontendReview {
  id: string;
  user_id?: string;
  course_id?: string;
  professor_id?: string;
  user?: FrontendUser;
  course?: FrontendCourse;
  professor?: FrontendProfessor;
  course_instructors?: FrontendCourseInstructor[];
  author: {
    username: string;
    echoes: number;
    isVerified: boolean;
  };
  content?: string;
  rating: number;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: string;
  created_at?: string;
  isEdited: boolean;
  userVote: "up" | "down" | null;
  user_vote?: Vote;
  isOwn: boolean;
  courseName?: string;
  professorName?: string;
  isHighlighted?: boolean;
}

export interface FrontendReply {
  id: string;
  user_id?: string;
  author: {
    username: string;
    echoes: number;
    isVerified: boolean;
  };
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  isEdited: boolean;
  userVote: "up" | "down" | null;
  isOwn: boolean;
  isHighlighted?: boolean;
}

// Component Props Interfaces
export interface ReviewFormProps {
  onSubmit: (data: { content: string; rating: number }) => Promise<void> | void;
  onCancel: () => void;
  placeholder: string;
  disabled?: boolean;
}

export interface ReviewListProps {
  reviews: FrontendReview[];
  showCourse?: boolean;
  showProfessor?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  onVote: (reviewId: string, type: "up" | "down") => Promise<void> | void;
  onReply: (reviewId: string, content?: string) => Promise<void> | void;
  onEdit?: (
    reviewId: string,
    data?: { content?: string; rating?: number }
  ) => Promise<void> | void;
  onDelete?: (reviewId: string) => Promise<void> | void;
  onReport?: (
    reviewId: string,
    reportType?: string,
    reason?: string
  ) => Promise<void> | void;
}

export interface ReplyListProps {
  replies: FrontendReply[];
  reviewId?: string;
  collapsed?: boolean;
  onSubmitReply?: (reviewId: string, content: string) => Promise<void> | void;
  onVote: (replyId: string, type: "up" | "down") => Promise<void> | void;
  onEdit?: (replyId: string, content: string) => Promise<void> | void;
  onDelete?: (replyId: string) => Promise<void> | void;
  onReport?: (
    replyId: string,
    reportType?: string,
    reason?: string
  ) => Promise<void> | void;
}

// API Request Interfaces
export interface VoteRequest {
  review_id?: string;
  reply_id?: string;
  vote_type: boolean; // TRUE for upvote, FALSE for downvote
}

export interface ReportRequest {
  review_id?: string;
  reply_id?: string;
  reported_user_id?: string;
  report_type:
    | "spam"
    | "harassment"
    | "inappropriate"
    | "misinformation"
    | "other";
  reason: string;
}

// UI Related Interfaces
export interface Rank {
  name: string;
  min: number;
  max: number;
  color: string;
  gradient: string;
  icon: string;
  // Additional frontend properties
  nextRankName?: string;
  echoesToNext?: number;
}

// Helper functions for converting between backend and frontend models
export function convertUserToFrontendUser(
  user: User,
  isFollowing?: boolean
): FrontendUser {
  return {
    ...user,
    isVerified: !(user.is_muffled && !user.is_banned),
    isFollowing: isFollowing,
  };
}

export function convertNotificationToFrontendNotification(
  notification: Notification
): FrontendNotification {
  return {
    ...notification,
    is_read: notification.is_read,
    read: notification.is_read,
  };
}

export function convertReviewToFrontendReview(
  review: Review,
  userVote?: Vote | null,
  currentUserId?: string
): FrontendReview {
  // console.log("Review conversion:", {
  //   reviewId: review.id,
  //   reviewUserId: review.user_id,
  //   currentUserId,
  //   wouldBeOwn: review.user_id === currentUserId
  // });
  return {
    id: review.id,
    user_id: review.user_id,
    course_id: review.course_id,
    professor_id: review.professor_id,
    user: review.user
      ? convertUserToFrontendUser(review.user, false)
      : undefined,
    course: review.course as FrontendCourse,
    professor: review.professor as FrontendProfessor,
    course_instructors: review.course_instructors?.map(ci => ci as FrontendCourseInstructor) || [],
    author: {
      username: review.user?.username || "Unknown",
      echoes: review.user?.echoes || 0,
      isVerified: review.user ? !(review.user.is_muffled && review.user.is_banned) : false,
    },
    content: review.content,
    rating: review.rating,
    upvotes: review.upvotes,
    downvotes: review.downvotes,
    replyCount: 0, // This should be populated by the caller
    createdAt: review.created_at,
    created_at: review.created_at,
    isEdited: review.is_edited,
    userVote: userVote ? (userVote.vote_type ? "up" : "down") : null,
    user_vote: userVote || undefined,
    isOwn: currentUserId ? review.user_id === currentUserId : false,
    courseName: review.course?.name,
    professorName: review.professor?.name,
  };
}

export function convertReplyToFrontendReply(
  reply: Reply,
  userVote?: Vote | null,
  currentUserId?: string
): FrontendReply {
  // console.log("Reply conversion:", {
  //   replyId: reply.id,
  //   replyUserId: reply.user_id,
  //   currentUserId,
  //   wouldBeOwn: reply.user_id === currentUserId
  // });
  return {
    id: reply.id,
    author: {
      username: reply.user?.username || "Unknown",
      echoes: reply.user?.echoes || 0,
      isVerified: reply.user ? !(reply.user.is_muffled && reply.user.is_banned) : false,
    },
    content: reply.content,
    upvotes: reply.upvotes,
    downvotes: reply.downvotes,
    createdAt: reply.created_at,
    isEdited: reply.is_edited,
    userVote: userVote ? (userVote.vote_type ? "up" : "down") : null,
    isOwn: currentUserId ? reply.user_id === currentUserId : false,
  };
}

export function convertCourseToFrontendCourse(course: Course): FrontendCourse {
  return {
    ...course,
    average_rating: course.average_rating,
  };
}

export function convertProfessorToFrontendProfessor(
  professor: Professor
): FrontendProfessor {
  return {
    ...professor,
    average_rating: professor.average_rating,
  };
}

export function convertCourseInstructorToFrontendCourseInstructor(
  courseInstructor: CourseInstructor
): FrontendCourseInstructor {
  return {
    ...courseInstructor,
    average_rating: courseInstructor.average_rating,
  };
}
