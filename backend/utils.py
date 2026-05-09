"""
Utility functions for common operations.
"""

from fastapi import HTTPException


def validate_pagination(skip: int = 0, limit: int = 100) -> tuple[int, int]:
    """
    Validate and normalize pagination parameters.

    Args:
        skip: Number of records to skip (must be >= 0)
        limit: Maximum number of records to return (must be between 1 and 1000)

    Returns:
        Tuple of (skip, limit) with validated values

    Raises:
        HTTPException: If parameters are invalid
    """
    if skip < 0:
        raise HTTPException(status_code=400, detail="skip must be >= 0")

    if limit < 1:
        raise HTTPException(status_code=400, detail="limit must be >= 1")

    if limit > 1000:
        raise HTTPException(status_code=400, detail="limit must be <= 1000")

    return skip, limit
