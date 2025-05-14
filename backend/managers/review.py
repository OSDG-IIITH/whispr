"""
Review manager module for review-related database operations.

This module defines the ReviewManager class that provides operations
for managing reviews, including creation, querying, voting, and tag generation.
"""
import logging
import re
from typing import Dict, List
from datetime import datetime
from bson import ObjectId

from managers.base import BaseManager, log_operation, require_auth

from managers.course import CourseManager
from managers.professor import ProfessorManager
from managers.user import UserManager
from managers.notification import NotificationManager

# Configure logging
logger = logging.getLogger(__name__)


class ReviewManager(BaseManager):
    """
    Manager for review-related operations.

    This class provides methods for review creation, querying, voting,
    and automated tag generation.
    """

    def __init__(self):
        """Initialize the review manager."""
        # Reviews require unmuffled status to create/update
        super().__init__('reviews', require_unmuffled=True)

    @log_operation
    @require_auth
    async def create_review(self, review_data: Dict, user_id: str) -> Dict:
        """
        Create a new review.

        Args:
            review_data: Review data
            user_id: ID of the user creating the review

        Returns:
            Created review document
        """
        # Set reviewer ID
        review_data['reviewer_id'] = ObjectId(user_id)

        # Convert string IDs to ObjectIds
        if 'type_id' in review_data and isinstance(
            review_data['type_id'], str
        ):
            review_data['type_id'] = ObjectId(review_data['type_id'])

        if 'instructor_ids' in review_data and isinstance(
            review_data['instructor_ids'], list
        ):
            review_data['instructor_ids'] = [
                ObjectId(id) if isinstance(id, str) else id
                for id in review_data['instructor_ids']
            ]

        # Initialize voting counts
        review_data['upvote_count'] = 0
        review_data['downvote_count'] = 0

        # Set timestamp
        review_data['timestamp'] = datetime.utcnow()

        # Generate tags
        review_data['tags'] = await self._generate_tags(review_data['content'])

        # Create the review
        result = await self.collection.insert_one(review_data)
        created_review = await self.get_by_id(str(result.inserted_id))

        # Update review stats on the target entity
        target_collection = "courses" \
            if review_data['type'] == "course" else "professors"

        # Get the manager for the target collection
        target_manager = None
        if target_collection == "courses":
            target_manager = CourseManager()
        else:
            target_manager = ProfessorManager()

        await target_manager.update_review_stats(str(review_data['type_id']))

        # Add echo points to the reviewer
        user_manager = UserManager()
        await user_manager.add_echoes(user_id, 10)

        # Extract mentions and create notifications
        await self._process_mentions(created_review)

        return created_review

    async def _generate_tags(self, content: str) -> List[str]:
        """
        Generate tags from review content.

        Args:
            content: Review text content

        Returns:
            List of generated tags
        """
        # This is a placeholder for actual NLP tag generation
        # In a real implementation, you would use a more sophisticated approach

        # Common tags to look for in reviews
        tag_patterns = {
            "easy": r"\beasy\b|\bsimple\b|\bstraightforward\b",
            "difficult": r"\bdifficult\b|\bhard\b|\bchallenging\b",
            "interesting": r"\binteresting\b|\bengaging\b|\bfascinating\b",
            "boring": r"\bboring\b|\bdull\b|\btedious\b",
            "helpful": r"\bhelpful\b|\buseful\b|\bbeneficial\b",
            "time-consuming": r"\btime\s*consuming\b|\btakes\s*time\b",
            "well-organized": r"\bwell\s*organized\b|\bstructured\b|\bclear\b",
            "disorganized": r"\bdisorganized\b|\bunstructured\b|\bmessy\b",
            "informative": r"\binformative\b|\beducational\b|\binstructive\b",
            "practical": r"\bpractical\b|\bhands\-on\b|\bapplicable\b"
        }

        tags = []
        for tag, pattern in tag_patterns.items():
            if re.search(pattern, content, re.IGNORECASE):
                tags.append(tag)

        return tags

    async def _process_mentions(self, review: Dict) -> None:
        """
        Process mentions in review content and create notifications.

        Args:
            review: Review document
        """
        # Extract usernames that start with @ symbol
        content = review.get('content', '')
        mentions = re.findall(r'@(\w+)', content)

        if not mentions:
            return

        # Get unique usernames
        unique_mentions = set(mentions)

        # Check if mentioned users exist and create notifications
        db = self.collection.database
        notification_manager = NotificationManager()

        reviewer = await db.users.find_one({"_id": review['reviewer_id']})
        reviewer_username = reviewer.get('username', 'unknown')

        for username in unique_mentions:
            user = await db.users.find_one({"username": username})
            if user:
                # Create notification for the mentioned user
                notification_data = {
                    "username": username,
                    "type": "mention",
                    "message":
                    f"You were mentioned by {reviewer_username} in a review",
                    "source_id": str(review['_id']),
                    "source_type": "review",
                    "actor_username": reviewer_username
                }
                await notification_manager.create_notification(
                    notification_data
                )

    @log_operation
    @require_auth
    async def update_review(
        self, review_id: str, review_data: Dict, user_id: str
    ) -> Dict:
        """
        Update an existing review.

        Args:
            review_id: Review ID to update
            review_data: Updated review data
            user_id: ID of the user updating the review

        Returns:
            Updated review document
        """
        # Get the existing review
        review = await self.get_by_id(review_id)

        # Check if the user is the original reviewer
        if str(review['reviewer_id']) != user_id:
            raise ValueError(
                "Only the original reviewer can update this review")

        # Set edited flag and update content/rating
        update_data = {"edited": True}

        if 'content' in review_data:
            update_data['content'] = review_data['content']
            update_data['tags'] = await self._generate_tags(
                review_data['content']
            )

        if 'rating' in review_data:
            update_data['rating'] = review_data['rating']

        # Update the review
        updated_review = await self.update(review_id, update_data)

        # Update review stats on the target entity
        target_collection = "courses" \
            if review['type'] == "course" else "professors"

        # Get the manager for the target collection
        target_manager = None
        if target_collection == "courses":
            target_manager = CourseManager()
        else:
            target_manager = ProfessorManager()

        await target_manager.update_review_stats(str(review['type_id']))

        # Extract mentions and create notifications
        await self._process_mentions(updated_review)

        return updated_review

    @log_operation
    @require_auth
    async def delete_review(self, review_id: str, user_id: str) -> bool:
        """
        Delete a review.

        Args:
            review_id: Review ID to delete
            user_id: ID of the user deleting the review

        Returns:
            True if deleted successfully, False otherwise
        """
        # Get the existing review
        review = await self.get_by_id(review_id)

        # Check if the user is the original reviewer
        if str(review['reviewer_id']) != user_id:
            raise ValueError(
                "Only the original reviewer can delete this review")

        # Store type and type_id for updating stats after deletion
        review_type = review['type']
        type_id = review['type_id']

        # Delete all replies to this review
        db = self.collection.database
        await db.replies.delete_many({"review_id": ObjectId(review_id)})

        # Delete all votes on this review
        await db.votes.delete_many({
            "content_type": "review",
            "content_id": ObjectId(review_id)
        })

        # Delete the review
        result = await self.delete(review_id)

        if result:
            # Update review stats on the target entity
            target_collection = "courses" \
                if review_type == "course" else "professors"

            # Get the manager for the target collection
            target_manager = None
            if target_collection == "courses":
                target_manager = CourseManager()
            else:
                target_manager = ProfessorManager()

            await target_manager.update_review_stats(str(type_id))

            # Subtract echo points from the reviewer
            user_manager = UserManager()
            await user_manager.add_echoes(user_id, -10)

        return result

    @log_operation
    async def get_reviews(
        self,
        skip: int = 0,
        limit: int = 20,
        filters: Dict = None,
        sort_by: str = "timestamp",
        sort_order: int = -1
    ) -> List[Dict]:
        """
        Get reviews with pagination, filtering and sorting.

        Args:
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            filters: Query filters to apply
            sort_by: Field to sort by (default: timestamp)
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of review documents
        """
        return await self.get_all(skip, limit, filters, sort_by, sort_order)

    @log_operation
    async def get_reviews_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "timestamp",
        sort_order: int = -1
    ) -> List[Dict]:
        """
        Get all reviews by a specific user.

        Args:
            user_id: User ID
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of review documents
        """
        filters = {"reviewer_id": ObjectId(user_id)}
        return await self.get_all(skip, limit, filters, sort_by, sort_order)

    @log_operation
    async def get_reviews_by_type_id(
        self,
        review_type: str,
        type_id: str,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "timestamp",
        sort_order: int = -1
    ) -> List[Dict]:
        """
        Get all reviews for a specific course or professor.

        Args:
            review_type: Review type ("course" or "professor")
            type_id: ID of the course or professor
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of review documents
        """
        filters = {
            "type": review_type,
            "type_id": ObjectId(type_id)
        }

        return await self.get_all(skip, limit, filters, sort_by, sort_order)

    @log_operation
    async def search_reviews(
        self,
        query: str,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "timestamp",
        sort_order: int = -1
    ) -> List[Dict]:
        """
        Search for reviews by content or tags.

        Args:
            query: Search query string
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of matching review documents
        """
        # Create case-insensitive regex for search
        regex = re.compile(f".*{re.escape(query)}.*", re.IGNORECASE)

        # Search in content and tags fields
        filters = {
            "$or": [
                {"content": {"$regex": regex}},
                {"tags": {"$in": [query]}}
            ]
        }

        cursor = self.collection.find(filters).skip(
            skip).limit(limit).sort(sort_by, sort_order)

        return await cursor.to_list(length=limit)

    @log_operation
    async def deep_search_reviews(
        self,
        query: str,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "timestamp",
        sort_order: int = -1
    ) -> List[Dict]:
        """
        Perform a deep search through review content.
        This is a more intensive search that could use external NLP services.

        Args:
            query: Search query string
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of matching review documents
        """
        # This is a placeholder for a more sophisticated search implementation
        # In a real system, might use an external search service or NLP model

        # For now, fall back to a regex search with more flexibility
        terms = query.lower().split()

        # Get all reviews
        all_reviews = await self.collection.find({}).to_list(length=None)

        # Calculate a relevance score for each review
        scored_reviews = []
        for review in all_reviews:
            content = review.get('content', '').lower()

            # Count how many query terms appear in the content
            score = sum(1 for term in terms if term in content)

            # Add bonus points for exact phrase match
            if query.lower() in content:
                score += 3

            # Add points for tag matches
            tags = [tag.lower() for tag in review.get('tags', [])]
            score += sum(1 for term in terms if term in tags)

            if score > 0:
                scored_reviews.append((score, review))

        # Sort by score (descending) and then by the requested sort field
        scored_reviews.sort(
            key=lambda x: (-x[0], review.get(sort_by, 0) * sort_order))

        # Apply pagination
        paginated_reviews = [review for _,
                             review in scored_reviews[skip:skip+limit]]

        return paginated_reviews

    @log_operation
    async def get_review_suggestions(
        self, query: str, limit: int = 5
    ) -> List[Dict]:
        """
        Get autocomplete suggestions for review search.

        Args:
            query: Partial search query
            limit: Maximum number of suggestions

        Returns:
            List of suggestion documents
        """
        # Create case-insensitive regex for prefix search
        regex = re.compile(f"^{re.escape(query)}.*", re.IGNORECASE)

        # Search in tags and commonly used phrases
        pipeline = [
            {"$match": {"tags": {"$regex": regex}}},
            {"$unwind": "$tags"},
            {"$match": {"tags": {"$regex": regex}}},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit}
        ]

        suggestions = await self.collection.aggregate(pipeline).to_list(
            length=limit
        )

        return [{"text": s["_id"], "type": "tag"} for s in suggestions]

    @log_operation
    async def get_reviews_by_tags(
        self,
        tags: List[str],
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "timestamp",
        sort_order: int = -1
    ) -> List[Dict]:
        """
        Get reviews that match one or more tags.

        Args:
            tags: List of tags to match
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of matching review documents
        """
        filters = {"tags": {"$in": tags}}

        return await self.get_all(skip, limit, filters, sort_by, sort_order)
