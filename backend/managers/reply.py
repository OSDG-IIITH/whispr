"""
Reply manager module for reply-related database operations.

This module defines the ReplyManager class that provides operations for
managing replies to reviews, including creation, querying, and voting.
"""
import logging
import re
from typing import Dict, List
from datetime import datetime
from bson import ObjectId

from managers.base import BaseManager, log_operation, require_auth
from managers.notification import NotificationManager
from managers.user import UserManager


# Configure logging
logger = logging.getLogger(__name__)


class ReplyManager(BaseManager):
    """
    Manager for reply-related operations.

    This class provides methods for reply creation, querying, and voting
    on replies to reviews.
    """

    def __init__(self):
        """Initialize the reply manager."""
        # Replies require unmuffled status
        super().__init__('replies', require_unmuffled=True)

    @log_operation
    @require_auth
    async def create_reply(
        self, reply_data: Dict, user_id: str
    ) -> Dict:
        """
        Create a new reply to a review.

        Args:
            reply_data: Reply data
            user_id: ID of the user creating the reply

        Returns:
            Created reply document
        """
        # Set replier ID
        reply_data['replier_id'] = ObjectId(user_id)

        # Convert string IDs to ObjectIds
        if ('review_id' in reply_data and
                isinstance(reply_data['review_id'], str)):
            reply_data['review_id'] = ObjectId(reply_data['review_id'])

        # Initialize voting counts
        reply_data['upvote_count'] = 0
        reply_data['downvote_count'] = 0

        # Set timestamp
        reply_data['timestamp'] = datetime.utcnow()

        # Create the reply
        result = await self.collection.insert_one(reply_data)
        created_reply = await self.get_by_id(str(result.inserted_id))

        # Get the original review and reviewer to send notification
        db = self.collection.database
        review = await db.reviews.find_one({"_id": reply_data['review_id']})

        if review:
            reviewer = await db.users.find_one({"_id": review['reviewer_id']})
            replier = await db.users.find_one({"_id": ObjectId(user_id)})

            if reviewer and replier and str(reviewer['_id']) != user_id:
                # Create notification for the review author
                notification_manager = NotificationManager()

                notification_data = {
                    "username": reviewer['username'],
                    "type": "reply",
                    "message":
                    f"@{replier['username']} replied to your review",
                    "source_id": str(created_reply['_id']),
                    "source_type": "reply",
                    "actor_username": replier['username']
                }
                await notification_manager.create_notification(
                    notification_data
                )

        # Add echo points to the replier
        user_manager = UserManager()
        await user_manager.add_echoes(user_id, 5)

        # Extract mentions and create notifications
        await self._process_mentions(created_reply)

        return created_reply

    async def _process_mentions(self, reply: Dict) -> None:
        """
        Process mentions in reply content and create notifications.

        Args:
            reply: Reply document
        """
        # Extract usernames that start with @ symbol
        content = reply.get('content', '')
        mentions = re.findall(r'@(\w+)', content)

        if not mentions:
            return

        # Get unique usernames
        unique_mentions = set(mentions)

        # Check if mentioned users exist and create notifications
        db = self.collection.database

        notification_manager = NotificationManager()

        replier = await db.users.find_one({"_id": reply['replier_id']})
        replier_username = replier.get('username', 'unknown')

        for username in unique_mentions:
            user = await db.users.find_one({"username": username})
            # Don't notify self-mentions
            if user and user['username'] != replier_username:
                # Create notification for the mentioned user
                notification_data = {
                    "username": username,
                    "type": "mention",
                    "message":
                    f"You were mentioned by @{replier_username} in a reply",
                    "source_id": str(reply['_id']),
                    "source_type": "reply",
                    "actor_username": replier_username
                }
                await notification_manager.create_notification(
                    notification_data
                )

    @log_operation
    @require_auth
    async def update_reply(
        self, reply_id: str, reply_data: Dict, user_id: str
    ) -> Dict:
        """
        Update an existing reply.

        Args:
            reply_id: Reply ID to update
            reply_data: Updated reply data
            user_id: ID of the user updating the reply

        Returns:
            Updated reply document
        """
        # Get the existing reply
        reply = await self.get_by_id(reply_id)

        # Check if the user is the original replier
        if str(reply['replier_id']) != user_id:
            raise ValueError("Only the original replier can update this reply")

        # Set edited flag and update content
        update_data = {
            "edited": True,
            "content": reply_data.get('content', reply['content'])
        }

        # Update the reply
        updated_reply = await self.update(reply_id, update_data)

        # Extract mentions and create notifications
        await self._process_mentions(updated_reply)

        return updated_reply

    @log_operation
    @require_auth
    async def delete_reply(self, reply_id: str, user_id: str) -> bool:
        """
        Delete a reply.

        Args:
            reply_id: Reply ID to delete
            user_id: ID of the user deleting the reply

        Returns:
            True if deleted successfully, False otherwise
        """
        # Get the existing reply
        reply = await self.get_by_id(reply_id)

        # Check if the user is the original replier
        if str(reply['replier_id']) != user_id:
            raise ValueError("Only the original replier can delete this reply")

        # Delete all votes on this reply
        db = self.collection.database
        await db.votes.delete_many({
            "content_type": "reply",
            "content_id": ObjectId(reply_id)
        })

        # Delete the reply
        result = await self.delete(reply_id)

        if result:
            # Subtract echo points from the replier
            user_manager = UserManager()
            await user_manager.add_echoes(user_id, -5)

        return result

    @log_operation
    async def get_replies_for_review(
        self,
        review_id: str,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "timestamp",
        sort_order: int = 1
    ) -> List[Dict]:
        """
        Get all replies for a specific review.

        Args:
            review_id: Review ID
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of reply documents
        """
        filters = {"review_id": ObjectId(review_id)}

        return await self.get_all(skip, limit, filters, sort_by, sort_order)

    @log_operation
    async def get_replies_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "timestamp",
        sort_order: int = -1
    ) -> List[Dict]:
        """
        Get all replies by a specific user.

        Args:
            user_id: User ID
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of reply documents
        """
        filters = {"replier_id": ObjectId(user_id)}

        return await self.get_all(skip, limit, filters, sort_by, sort_order)

    @log_operation
    async def get_replies_with_review_data(
        self,
        user_id: str = None,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "timestamp",
        sort_order: int = -1
    ) -> List[Dict]:
        """
        Get replies with their associated review data.

        Args:
            user_id: Optional user ID to filter by
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of reply documents with review information
        """
        match_stage = {}
        if user_id:
            match_stage["replier_id"] = ObjectId(user_id)

        pipeline = [
            {"$match": match_stage},
            {"$sort": {sort_by: sort_order}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "reviews",
                    "localField": "review_id",
                    "foreignField": "_id",
                    "as": "review"
                }
            },
            {"$unwind": "$review"},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "replier_id",
                    "foreignField": "_id",
                    "as": "replier"
                }
            },
            {"$unwind": "$replier"},
            {
                "$project": {
                    "_id": 1,
                    "content": 1,
                    "timestamp": 1,
                    "upvote_count": 1,
                    "downvote_count": 1,
                    "edited": 1,
                    "review_id": 1,
                    "replier_id": 1,
                    "review_content": "$review.content",
                    "review_type": "$review.type",
                    "review_type_id": "$review.type_id",
                    "replier_username": "$replier.username"
                }
            }
        ]

        return await self.collection.aggregate(pipeline).to_list(length=limit)
