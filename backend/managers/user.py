"""
User manager module for user-related database operations.

This module defines the UserManager class that provides operations for managing
user accounts, authentication, and profile management.
"""
from datetime import datetime
from typing import Dict, List, Optional
import logging
import bcrypt
from bson import ObjectId

from config import Config
from managers.base import BaseManager, log_operation, require_auth

# Configure logging
logger = logging.getLogger(__name__)


class UserRank:
    """
    User rank definitions based on echo points.
    """
    NEW_VOICE = (0, 99, "New Voice")
    LOWKEY = (100, 499, "Lowkey")
    TRUSTED_WHISPERER = (500, 999, "Trusted Whisperer")
    SILENT_FORCE = (1000, 1999, "Silent Force")
    THE_ONE_WHO_KNOWS = (2000, float('inf'), "The One Who Knows")

    @staticmethod
    def get_rank(echoes: int) -> str:
        """
        Get the rank title based on echo points.

        Args:
            echoes: Number of echo points

        Returns:
            Rank title string
        """
        ranks = [
            UserRank.NEW_VOICE,
            UserRank.LOWKEY,
            UserRank.TRUSTED_WHISPERER,
            UserRank.SILENT_FORCE,
            UserRank.THE_ONE_WHO_KNOWS
        ]

        for min_points, max_points, title in ranks:
            if min_points <= echoes <= max_points:
                return title

        return UserRank.NEW_VOICE[2]  # Default rank


class UserManager(BaseManager):
    """
    Manager for user-related operations.

    This class provides methods for user account creation, authentication,
    profile management, and user interaction features.
    """

    def __init__(self):
        """Initialize the user manager."""
        super().__init__('users')

    @log_operation
    async def create_user(self, user_data: Dict) -> Dict:
        """
        Create a new user account.

        Args:
            user_data: User profile data

        Returns:
            Created user document
        """
        # Default values
        user_data['muffled'] = True  # Start as muffled until verified
        user_data['echoes'] = 0
        user_data['created_at'] = datetime.utcnow()
        user_data['following'] = []  # List of usernames the user follows

        # If password is provided, hash it
        if 'password' in user_data:
            # Check minimum password length
            if len(user_data['password']) < Config.MIN_PASSWORD_LENGTH:
                raise ValueError(
                    f"Password must be at least \
{Config.MIN_PASSWORD_LENGTH}\
characters long"
                )

            # Generate salt and hash the password with bcrypt
            password_bytes = user_data['password'].encode('utf-8')
            salt = bcrypt.gensalt(rounds=12)  # Work factor of 12
            password_hash = bcrypt.hashpw(password_bytes, salt)

            # Store the hashed password (contains the salt)
            user_data['password_hash'] = password_hash.decode(
                'utf-8')  # Store as string
            del user_data['password']  # Remove plain password

        result = await self.collection.insert_one(user_data)
        return await self.get_by_id(str(result.inserted_id))

    @log_operation
    async def verify_password(
        self, username: str, password: str
    ) -> Optional[Dict]:
        """
        Verify user credentials for login.

        Args:
            username: User's username
            password: User's password

        Returns:
            User document if credentials are valid, None otherwise
        """
        user = await self.collection.find_one({"username": username})
        if not user or 'password_hash' not in user:
            return None

        # Get stored password hash (already includes salt)
        stored_hash = user['password_hash']

        # Check if the password matches using bcrypt
        try:
            # Convert stored hash back to bytes for comparison
            if bcrypt.checkpw(
                password.encode('utf-8'),
                stored_hash.encode('utf-8')
            ):
                return user
        except (ValueError, TypeError) as e:
            logger.error("Error verifying password: %s", e)

        return None

    @log_operation
    async def unmute_user(self, user_id: str) -> Dict:
        """
        Remove the muffled status of a user after CAS verification.

        Args:
            user_id: User ID to unmute

        Returns:
            Updated user document
        """
        return await self.update(user_id, {"muffled": False})

    @log_operation
    async def update_username(
        self, user_id: str, new_username: str
    ) -> Optional[Dict]:
        """
        Update a user's username.

        Args:
            user_id: User ID to update
            new_username: New username

        Returns:
            Updated user document
        """
        # Check if username is already taken
        existing = await self.collection.find_one({"username": new_username})
        if existing:
            raise ValueError(f"Username '{new_username}' is already taken")

        return await self.update(user_id, {"username": new_username})

    @log_operation
    @require_auth
    async def update_profile(
        self, user_id: str, profile_data: Dict
    ) -> Dict:
        """
        Update a user's profile information.

        Args:
            user_id: User ID to update
            profile_data: Profile data to update

        Returns:
            Updated user document
        """
        allowed_fields = ['avatar', 'bio', 'student_since']
        update_data = {k: v for k, v in profile_data.items()
                       if k in allowed_fields}

        return await self.update(user_id, update_data)

    @log_operation
    async def add_echoes(self, user_id: str, points: int) -> Dict:
        """
        Add echo points to a user's account.

        Args:
            user_id: User ID to update
            points: Number of points to add (can be negative)

        Returns:
            Updated user document
        """
        user = await self.get_by_id(user_id)
        current_echoes = user.get('echoes', 0)
        new_echoes = max(0, current_echoes + points)  # Prevent negative echoes

        return await self.update(user_id, {"echoes": new_echoes})

    @log_operation
    @require_auth
    async def follow_user(
        self, user_id: str, username_to_follow: str
    ) -> Dict:
        """
        Follow another user.

        Args:
            user_id: ID of the user who wants to follow
            username_to_follow: Username of the user to follow

        Returns:
            Updated user document
        """
        # Check if user exists
        target_user = await self.collection.find_one(
            {"username": username_to_follow}
        )
        if not target_user:
            raise ValueError(f"User '{username_to_follow}' not found")

        # Add to following list if not already following
        await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"following": username_to_follow}}
        )

        return await self.get_by_id(user_id)

    @log_operation
    @require_auth
    async def unfollow_user(
        self, user_id: str, username_to_unfollow: str
    ) -> Dict:
        """
        Unfollow another user.

        Args:
            user_id: ID of the user who wants to unfollow
            username_to_unfollow: Username of the user to unfollow

        Returns:
            Updated user document
        """
        await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"following": username_to_unfollow}}
        )

        return await self.get_by_id(user_id)

    @log_operation
    async def get_user_rank(self, user_id: str) -> Dict:
        """
        Get a user's current rank based on echo points.

        Args:
            user_id: User ID to check

        Returns:
            Dictionary with rank information
        """
        user = await self.get_by_id(user_id)
        echoes = user.get('echoes', 0)
        rank_title = UserRank.get_rank(echoes)

        return {
            "echoes": echoes,
            "rank": rank_title,
            "next_rank": self._get_next_rank(echoes)
        }

    def _get_next_rank(self, echoes: int) -> Optional[Dict]:
        """
        Get information about the next rank.

        Args:
            echoes: Current echo points

        Returns:
            Dictionary with next rank information or None if at max rank
        """
        ranks = [
            UserRank.NEW_VOICE,
            UserRank.LOWKEY,
            UserRank.TRUSTED_WHISPERER,
            UserRank.SILENT_FORCE,
            UserRank.THE_ONE_WHO_KNOWS
        ]

        for i, (min_points, max_points, _title) in enumerate(ranks):
            if min_points <= echoes <= max_points and i < len(ranks) - 1:
                next_min, _, next_title = ranks[i+1]
                return {
                    "title": next_title,
                    "points_needed": next_min - echoes
                }

        return None  # Already at highest rank

    @log_operation
    async def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """
        Get the top users by echo points.

        Args:
            limit: Maximum number of users to return

        Returns:
            List of top users with their ranks
        """
        cursor = self.collection.find({}).sort("echoes", -1).limit(limit)
        users = await cursor.to_list(length=limit)

        leaderboard = []
        for user in users:
            leaderboard.append({
                "username": user.get('username'),
                "echoes": user.get('echoes', 0),
                "rank": UserRank.get_rank(user.get('echoes', 0))
            })

        return leaderboard

    @log_operation
    async def get_user_stats(self, user_id: str) -> Dict:
        """
        Get comprehensive statistics for a user.

        Args:
            user_id: User ID to get stats for

        Returns:
            Dictionary with user statistics
        """
        db = self.collection.database
        user = await self.get_by_id(user_id)

        # Count reviews
        reviews_count = await db.reviews.count_documents(
            {"reviewer_id": ObjectId(user_id)}
        )

        # Count replies
        replies_count = await db.replies.count_documents(
            {"replier_id": ObjectId(user_id)}
        )

        # Count votes received on content
        review_votes = await db.votes.count_documents({
            "content_type": "review",
            "content_id": {
                "$in": await self._get_user_content_ids(user_id, "reviews")
            }
        })

        reply_votes = await db.votes.count_documents({
            "content_type": "reply",
            "content_id": {
                "$in": await self._get_user_content_ids(user_id, "replies")
            }
        })

        # Get rank information
        rank_info = await self.get_user_rank(user_id)

        return {
            "username": user.get('username'),
            "echoes": user.get('echoes', 0),
            "rank": rank_info['rank'],
            "next_rank": rank_info.get('next_rank'),
            "reviews_count": reviews_count,
            "replies_count": replies_count,
            "votes_received": review_votes + reply_votes,
            "joined_date": user.get('created_at')
        }

    async def _get_user_content_ids(
            self, user_id: str, collection_name: str
    ) -> List[ObjectId]:
        """
        Get IDs of all content created by a user in a specific collection.

        Args:
            user_id: User ID
            collection_name: Name of the collection

        Returns:
            List of content ObjectIds
        """
        db = self.collection.database
        field_name = "reviewer_id" \
            if collection_name == "reviews" else "replier_id"

        cursor = getattr(db, collection_name).find(
            {field_name: ObjectId(user_id)},
            {"_id": 1}
        )

        content = await cursor.to_list(length=None)
        return [item['_id'] for item in content]

    @log_operation
    @require_auth
    async def delete_account(self, user_id: str) -> bool:
        """
        Delete a user account and all associated content.

        Args:
            user_id: User ID to delete

        Returns:
            True if account was deleted, False otherwise
        """
        db = self.collection.database
        user_obj_id = ObjectId(user_id)

        # Get username for log (before deleting)
        user = await self.get_by_id(user_id)
        username = user.get('username', 'unknown')

        # Delete all user's content
        await db.reviews.delete_many({"reviewer_id": user_obj_id})
        await db.replies.delete_many({"replier_id": user_obj_id})
        await db.votes.delete_many({"user_id": user_obj_id})
        await db.notifications.delete_many({"username": username})

        # Delete the user
        result = await self.delete(user_id)
        if result:
            logger.info("User account deleted: %s", username)

        return result

    @log_operation
    async def search_users(
        self, query: str, skip: int = 0, limit: int = 20
    ) -> List[Dict]:
        """
        Search for users by username or profile information.

        Args:
            query: Search query
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of user documents matching the search criteria
        """
        if not query or len(query.strip()) < 2:
            return []

        # Create search regex for case-insensitive search
        regex_pattern = {"$regex": query, "$options": "i"}

        # Create search query conditions
        search_conditions = {
            "$or": [
                {"username": regex_pattern},
                {"bio": regex_pattern}
            ]
        }

        # Execute search
        cursor = self.collection.find(
            search_conditions,
            # Don't include sensitive fields in search results
            {"password_hash": 0, "salt": 0}
        ).sort("echoes", -1).skip(skip).limit(limit)

        users = await cursor.to_list(length=limit)

        # Format users for display
        for user in users:
            if "_id" in user:
                user["_id"] = str(user["_id"])

            # Add rank information
            user["rank"] = UserRank.get_rank(user.get("echoes", 0))

        return users
