"""
Vote manager module for vote-related database operations.

This module defines the VoteManager class that provides operations for managing
votes on reviews and replies, including voting, checking existing votes, and
updating vote counts on content.
"""
import logging
from typing import Dict, Optional, List
from bson import ObjectId

from managers.base import BaseManager, log_operation, require_auth
from managers.notification import NotificationManager
from managers.user import UserManager


# Configure logging
logger = logging.getLogger(__name__)


class VoteManager(BaseManager):
    """
    Manager for vote-related operations.

    This class provides methods for vote creation, updating, and deletion,
    as well as handling the effects of votes on content and user echo points.
    """

    def __init__(self):
        """Initialize the vote manager."""
        # Votes require unmuffled status
        super().__init__('votes', require_unmuffled=True)

    @log_operation
    @require_auth
    async def create_or_update_vote(
        self, vote_data: Dict, user_id: str
    ) -> Dict:
        """
        Create a new vote or update an existing one.

        Args:
            vote_data: Vote data (content_type, content_id, vote_type)
            user_id: ID of the user casting the vote

        Returns:
            Created or updated vote document
        """
        # Set user ID
        vote_data['user_id'] = ObjectId(user_id)

        # Convert string IDs to ObjectIds
        if 'content_id' in vote_data and isinstance(
            vote_data['content_id'], str
        ):
            vote_data['content_id'] = ObjectId(vote_data['content_id'])

        # Check if this user already has a vote on this content
        existing_vote = await self.collection.find_one({
            "user_id": ObjectId(user_id),
            "content_type": vote_data['content_type'],
            "content_id": vote_data['content_id']
        })

        result = None
        old_vote_type = None

        if existing_vote:
            # Update the existing vote if vote type has changed
            if existing_vote['vote_type'] != vote_data['vote_type']:
                old_vote_type = existing_vote['vote_type']
                await self.collection.update_one(
                    {"_id": existing_vote['_id']},
                    {"$set": {"vote_type": vote_data['vote_type']}}
                )
                result = await self.get_by_id(str(existing_vote['_id']))
        else:
            # Create a new vote
            insert_result = await self.collection.insert_one(vote_data)
            result = await self.get_by_id(str(insert_result.inserted_id))

        # Update the vote count on the target content
        await self._update_content_vote_count(
            vote_data['content_type'],
            vote_data['content_id'],
            vote_data['vote_type'],
            old_vote_type
        )

        # Send notification to the content author
        await self._send_vote_notification(
            vote_data['content_type'],
            vote_data['content_id'],
            user_id,
            vote_data['vote_type']
        )

        # Update echo points for the content author
        await self._update_author_echoes(
            vote_data['content_type'],
            vote_data['content_id'],
            vote_data['vote_type'],
            old_vote_type
        )

        return result

    @log_operation
    @require_auth
    async def remove_vote(
        self, content_type: str, content_id: str, user_id: str
    ) -> bool:
        """
        Remove a vote from content.

        Args:
            content_type: Type of content (review or reply)
            content_id: ID of the content
            user_id: ID of the user who cast the vote

        Returns:
            True if vote was removed, False otherwise
        """
        # Get the existing vote to know its type
        existing_vote = await self.collection.find_one({
            "user_id": ObjectId(user_id),
            "content_type": content_type,
            "content_id": ObjectId(content_id)
        })

        if not existing_vote:
            return False

        vote_type = existing_vote['vote_type']

        # Remove the vote
        result = await self.collection.delete_one({
            "user_id": ObjectId(user_id),
            "content_type": content_type,
            "content_id": ObjectId(content_id)
        })

        if result.deleted_count > 0:
            # Update the vote count on the target content
            # (invert the vote effect)
            await self._update_content_vote_count(
                content_type,
                ObjectId(content_id),
                vote_type,
                None,
                remove=True
            )

            # Update echo points for the content author
            # (invert the vote effect)
            await self._update_author_echoes(
                content_type,
                ObjectId(content_id),
                vote_type,
                None,
                remove=True
            )

            return True

        return False

    @log_operation
    async def get_user_votes(
        self, user_id: str, skip: int = 0, limit: int = 20
    ) -> List[Dict]:
        """
        Get all votes cast by a user.

        Args:
            user_id: User ID
            skip: Number of documents to skip
            limit: Maximum number of documents to return

        Returns:
            List of vote documents
        """
        filters = {"user_id": ObjectId(user_id)}
        return await self.get_all(skip, limit, filters)

    @log_operation
    async def get_content_votes(
        self, content_type: str, content_id: str
    ) -> List[Dict]:
        """
        Get all votes for a specific content.

        Args:
            content_type: Type of content (review or reply)
            content_id: ID of the content

        Returns:
            List of vote documents
        """
        filters = {
            "content_type": content_type,
            "content_id": ObjectId(content_id)
        }
        return await self.get_all(0, 100, filters)

    @log_operation
    async def check_user_vote(
        self, content_type: str, content_id: str, user_id: str
    ) -> Optional[Dict]:
        """
        Check if a user has voted on specific content.

        Args:
            content_type: Type of content (review or reply)
            content_id: ID of the content
            user_id: User ID to check

        Returns:
            Vote document if found, None otherwise
        """
        return await self.collection.find_one({
            "content_type": content_type,
            "content_id": ObjectId(content_id),
            "user_id": ObjectId(user_id)
        })

    async def _update_content_vote_count(
        self,
        content_type: str,
        content_id: ObjectId,
        vote_type: str,
        old_vote_type: Optional[str] = None,
        remove: bool = False
    ) -> None:
        """
        Update vote counts on the target content.

        Args:
            content_type: Type of content (review or reply)
            content_id: ID of the content
            vote_type: Type of vote (upvote or downvote)
            old_vote_type: Previous vote type if this is a change
            remove: Whether this is a vote removal
        """
        db = self.collection.database
        collection_name = "reviews" if content_type == "review" else "replies"
        collection = getattr(db, collection_name)

        update_fields = {}

        # Handle vote removal
        if remove:
            if vote_type == "upvote":
                update_fields["upvote_count"] = -1
            else:
                update_fields["downvote_count"] = -1
        # Handle vote change
        elif old_vote_type:
            if old_vote_type == "upvote" and vote_type == "downvote":
                update_fields["upvote_count"] = -1
                update_fields["downvote_count"] = 1
            elif old_vote_type == "downvote" and vote_type == "upvote":
                update_fields["upvote_count"] = 1
                update_fields["downvote_count"] = -1
        # Handle new vote
        else:
            if vote_type == "upvote":
                update_fields["upvote_count"] = 1
            else:
                update_fields["downvote_count"] = 1

        # Apply the updates
        for field, value in update_fields.items():
            await collection.update_one(
                {"_id": content_id},
                {"$inc": {field: value}}
            )

    async def _send_vote_notification(
        self,
        content_type: str,
        content_id: ObjectId,
        voter_id: str,
        vote_type: str
    ) -> None:
        """
        Send notification to content author about the vote.

        Args:
            content_type: Type of content (review or reply)
            content_id: ID of the content
            voter_id: ID of the user who voted
            vote_type: Type of vote (upvote or downvote)
        """
        db = self.collection.database

        # Get the content
        collection_name = "reviews" if content_type == "review" else "replies"
        collection = getattr(db, collection_name)
        content = await collection.find_one({"_id": content_id})

        if not content:
            return

        # Get content author
        author_id_field = "reviewer_id" \
            if content_type == "review" else "replier_id"
        author_id = content.get(author_id_field)

        if not author_id or str(author_id) == voter_id:
            return  # Don't notify for self-votes

        author = await db.users.find_one({"_id": author_id})
        voter = await db.users.find_one({"_id": ObjectId(voter_id)})

        if not author or not voter:
            return

        # Create a notification
        notification_manager = NotificationManager()

        vote_action = "upvoted" if vote_type == "upvote" else "downvoted"

        notification_data = {
            "username": author['username'],
            "type": "vote",
            "message":
            f"@{voter['username']} {vote_action} your {content_type}",
            "source_id": str(content_id),
            "source_type": content_type,
            "actor_username": voter['username']
        }

        await notification_manager.create_notification(notification_data)

    async def _update_author_echoes(
        self,
        content_type: str,
        content_id: ObjectId,
        vote_type: str,
        old_vote_type: Optional[str] = None,
        remove: bool = False
    ) -> None:
        """
        Update echo points for the content author based on votes.

        Args:
            content_type: Type of content (review or reply)
            content_id: ID of the content
            vote_type: Type of vote (upvote or downvote)
            old_vote_type: Previous vote type if this is a change
            remove: Whether this is a vote removal
        """
        db = self.collection.database

        # Get the content
        collection_name = "reviews" if content_type == "review" else "replies"
        collection = getattr(db, collection_name)
        content = await collection.find_one({"_id": content_id})

        if not content:
            return

        # Get content author
        author_id_field = "reviewer_id" \
            if content_type == "review" else "replier_id"
        author_id = content.get(author_id_field)

        if not author_id:
            return

        # Calculate echo points change
        echo_change = 0

        # Handle vote removal
        if remove:
            echo_change = -1 if vote_type == "upvote" else 1
        # Handle vote change
        elif old_vote_type:
            if old_vote_type == "upvote" and vote_type == "downvote":
                # -1 for removing upvote, -1 for adding downvote
                echo_change = -2
            elif old_vote_type == "downvote" and vote_type == "upvote":
                # +1 for removing downvote, +1 for adding upvote
                echo_change = 2
        # Handle new vote
        else:
            echo_change = 1 if vote_type == "upvote" else -1

        # Update user's echo points
        if echo_change != 0:
            user_manager = UserManager()
            await user_manager.add_echoes(str(author_id), echo_change)
