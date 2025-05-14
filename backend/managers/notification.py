"""
Notification manager module for notification-related database operations.

This module defines the NotificationManager class that provides operations for
managing user notifications, including creation, marking as read, and
querying.
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime
from bson import ObjectId

from managers.base import BaseManager, log_operation, require_auth

# Configure logging
logger = logging.getLogger(__name__)


class NotificationManager(BaseManager):
    """
    Manager for notification-related operations.

    This class provides methods for creating notifications, marking them
    as read, and querying notifications for users.
    """

    def __init__(self):
        """Initialize the notification manager."""
        super().__init__('notifications')

    @log_operation
    async def create_notification(self, notification_data: Dict) -> Dict:
        """
        Create a new notification.

        Args:
            notification_data: Notification data

        Returns:
            Created notification document
        """
        # Set timestamp
        notification_data['timestamp'] = datetime.utcnow()

        # Set default read status
        if 'read' not in notification_data:
            notification_data['read'] = False

        # Create the notification
        result = await self.collection.insert_one(notification_data)
        return await self.get_by_id(str(result.inserted_id))

    @log_operation
    async def get_user_notifications(
        self,
        username: str,
        skip: int = 0,
        limit: int = 20,
        unread_only: bool = False,
        sort_by: str = "timestamp",
        sort_order: int = -1
    ) -> List[Dict]:
        """
        Get notifications for a user with pagination and filtering.

        Args:
            username: Username to get notifications for
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            unread_only: Whether to return only unread notifications
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of notification documents
        """
        filters = {"username": username}

        if unread_only:
            filters["read"] = False

        return await self.get_all(skip, limit, filters, sort_by, sort_order)

    @log_operation
    @require_auth
    async def mark_notification_read(
        self, notification_id: str, user_id: str
    ) -> Optional[Dict]:
        """
        Mark a notification as read.

        Args:
            notification_id: Notification ID to mark as read
            user_id: ID of the user marking the notification

        Returns:
            Updated notification document or None if not found/unauthorized
        """
        # Get the notification
        notification = await self.get_by_id(notification_id)

        if not notification:
            return None

        # Get the user
        db = self.collection.database
        user = await db.users.find_one({"_id": ObjectId(user_id)})

        if not user or user.get('username') != notification.get('username'):
            # User can only mark their own notifications as read
            raise ValueError(
                "Not authorized to mark this notification as read")

        return await self.update(notification_id, {"read": True})

    @log_operation
    @require_auth
    async def mark_all_notifications_read(
        self, user_id: str
    ) -> int:
        """
        Mark all notifications for a user as read.

        Args:
            user_id: ID of the user

        Returns:
            Number of notifications marked as read
        """
        # Get the user
        db = self.collection.database
        user = await db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            return 0

        # Mark all notifications as read
        result = await self.collection.update_many(
            {"username": user.get('username'), "read": False},
            {"$set": {"read": True}}
        )

        return result.modified_count

    @log_operation
    @require_auth
    async def delete_notification(
        self, notification_id: str, user_id: str
    ) -> bool:
        """
        Delete a notification.

        Args:
            notification_id: Notification ID to delete
            user_id: ID of the user deleting the notification

        Returns:
            True if deleted successfully, False otherwise
        """
        # Get the notification
        notification = await self.get_by_id(notification_id)

        if not notification:
            return False

        # Get the user
        db = self.collection.database
        user = await db.users.find_one({"_id": ObjectId(user_id)})

        if not user or user.get('username') != notification.get('username'):
            # User can only delete their own notifications
            raise ValueError("Not authorized to delete this notification")

        return await self.delete(notification_id)

    @log_operation
    async def count_unread_notifications(self, username: str) -> int:
        """
        Count unread notifications for a user.

        Args:
            username: Username to count notifications for

        Returns:
            Number of unread notifications
        """
        return await self.count({"username": username, "read": False})

    @log_operation
    async def create_rank_change_notification(
        self, user_id: str, new_rank: str
    ) -> Dict:
        """
        Create a notification for a user rank change.

        Args:
            user_id: ID of the user whose rank changed
            new_rank: New rank title

        Returns:
            Created notification document
        """
        # Get the user
        db = self.collection.database
        user = await db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            raise ValueError("User not found")

        notification_data = {
            "username": user.get('username'),
            "type": "rank_change",
            "message":
            f"Congratulations! You're now a {new_rank}!",
            "read": False
        }

        return await self.create_notification(notification_data)

    @log_operation
    async def create_system_notification(
        self, username: str, message: str
    ) -> Dict:
        """
        Create a system notification for a user.

        Args:
            username: Username to create the notification for
            message: Notification message

        Returns:
            Created notification document
        """
        notification_data = {
            "username": username,
            "type": "system",
            "message": message,
            "read": False
        }

        return await self.create_notification(notification_data)

    @log_operation
    async def create_bulk_system_notification(
        self, message: str
    ) -> int:
        """
        Create a system notification for all users.

        Args:
            message: Notification message

        Returns:
            Number of notifications created
        """
        db = self.collection.database

        # Get all usernames
        users = await db.users.find({}, {"username": 1}).to_list(length=None)
        usernames = [user.get('username')
                     for user in users if 'username' in user]

        # Create a notification for each user
        created_count = 0
        for username in usernames:
            notification_data = {
                "username": username,
                "type": "system",
                "message": message,
                "read": False,
                "timestamp": datetime.utcnow()
            }
            await self.collection.insert_one(notification_data)
            created_count += 1

        return created_count
