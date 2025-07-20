"""
Base repository interfaces for domain-driven architecture.

This module defines abstract interfaces for repositories, ensuring consistent
data access patterns across all domains while maintaining database agnosticism.
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Optional, List, Dict, Any, Union
from dataclasses import dataclass
from datetime import datetime
from enum import Enum


# Type variable for entity types
T = TypeVar('T')


class SortDirection(Enum):
    """Sort direction for queries."""
    ASC = "asc"
    DESC = "desc"


@dataclass
class PaginationParams:
    """Parameters for paginated queries."""
    page: int = 1
    page_size: int = 20
    
    @property
    def offset(self) -> int:
        """Calculate offset for database queries."""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """Get limit for database queries."""
        return self.page_size


@dataclass
class SortParams:
    """Parameters for sorting queries."""
    field: str
    direction: SortDirection = SortDirection.ASC


@dataclass
class QueryResult(Generic[T]):
    """Result of a paginated query."""
    items: List[T]
    total: int
    page: int
    page_size: int
    
    @property
    def total_pages(self) -> int:
        """Calculate total number of pages."""
        return (self.total + self.page_size - 1) // self.page_size
    
    @property
    def has_next(self) -> bool:
        """Check if there's a next page."""
        return self.page < self.total_pages
    
    @property
    def has_previous(self) -> bool:
        """Check if there's a previous page."""
        return self.page > 1


class IRepository(ABC, Generic[T]):
    """
    Base repository interface for CRUD operations.
    
    This interface defines standard data access methods that all repositories
    should implement, regardless of the underlying data store.
    """
    
    @abstractmethod
    async def get_by_id(self, entity_id: str) -> Optional[T]:
        """
        Retrieve an entity by its ID.
        
        Args:
            entity_id: The unique identifier of the entity
            
        Returns:
            The entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_many(
        self,
        filters: Optional[Dict[str, Any]] = None,
        pagination: Optional[PaginationParams] = None,
        sort: Optional[List[SortParams]] = None
    ) -> QueryResult[T]:
        """
        Retrieve multiple entities with optional filtering, pagination, and sorting.
        
        Args:
            filters: Dictionary of field-value pairs for filtering
            pagination: Pagination parameters
            sort: List of sort parameters
            
        Returns:
            QueryResult containing the entities and metadata
        """
        pass
    
    @abstractmethod
    async def create(self, entity: T) -> T:
        """
        Create a new entity.
        
        Args:
            entity: The entity to create
            
        Returns:
            The created entity with generated fields (e.g., ID, timestamps)
        """
        pass
    
    @abstractmethod
    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[T]:
        """
        Update an existing entity.
        
        Args:
            entity_id: The ID of the entity to update
            updates: Dictionary of fields to update
            
        Returns:
            The updated entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        """
        Delete an entity.
        
        Args:
            entity_id: The ID of the entity to delete
            
        Returns:
            True if deleted, False if not found
        """
        pass
    
    @abstractmethod
    async def exists(self, entity_id: str) -> bool:
        """
        Check if an entity exists.
        
        Args:
            entity_id: The ID of the entity to check
            
        Returns:
            True if exists, False otherwise
        """
        pass


class ITransactionalRepository(IRepository[T]):
    """
    Repository interface with transaction support.
    
    Extends the base repository interface with transaction management capabilities.
    """
    
    @abstractmethod
    async def begin_transaction(self) -> Any:
        """Begin a new transaction."""
        pass
    
    @abstractmethod
    async def commit_transaction(self, transaction: Any) -> None:
        """Commit a transaction."""
        pass
    
    @abstractmethod
    async def rollback_transaction(self, transaction: Any) -> None:
        """Rollback a transaction."""
        pass
    
    @abstractmethod
    async def create_in_transaction(self, entity: T, transaction: Any) -> T:
        """Create an entity within a transaction."""
        pass
    
    @abstractmethod
    async def update_in_transaction(
        self,
        entity_id: str,
        updates: Dict[str, Any],
        transaction: Any
    ) -> Optional[T]:
        """Update an entity within a transaction."""
        pass
    
    @abstractmethod
    async def delete_in_transaction(self, entity_id: str, transaction: Any) -> bool:
        """Delete an entity within a transaction."""
        pass


class IUnitOfWork(ABC):
    """
    Unit of Work pattern interface for managing transactions across repositories.
    
    This interface ensures that multiple repository operations can be executed
    within a single transaction, maintaining data consistency.
    """
    
    @abstractmethod
    async def __aenter__(self):
        """Enter the unit of work context."""
        pass
    
    @abstractmethod
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit the unit of work context, handling commit/rollback."""
        pass
    
    @abstractmethod
    async def commit(self) -> None:
        """Commit all changes in the unit of work."""
        pass
    
    @abstractmethod
    async def rollback(self) -> None:
        """Rollback all changes in the unit of work."""
        pass