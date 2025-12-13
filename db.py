"""
Database connection module
Re-exports db from models for backward compatibility
"""
from models import db

# Export db instance for routes that import from here
__all__ = ['db']
