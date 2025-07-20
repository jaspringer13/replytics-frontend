"""
Supabase implementation of repository interfaces.

This module provides base classes for implementing repositories with Supabase,
handling common patterns and reducing boilerplate code.
"""

from typing import TypeVar, Type, Optional, List, Dict, Any, Callable
from abc import ABC
import logging

from postgrest import AsyncRequestBuilder
from supabase import Client

from .repository import (
    IRepository, ITransactionalRepository, PaginationParams,
    SortParams, QueryResult, SortDirection
)
from ..errors.base import (
    ExternalServiceError, ResourceNotFoundError, InternalError, ErrorContext
)


logger = logging.getLogger(__name__)

T = TypeVar('T')


class SupabaseRepository(IRepository[T], ABC):
    """
    Base Supabase repository implementation.
    
    This class provides common Supabase operations while allowing
    domain-specific repositories to customize behavior.
    """
    
    def __init__(
        self,
        client: Client,
        table_name: str,
        entity_class: Type[T],
        domain_name: str
    ):
        self.client = client
        self.table_name = table_name
        self.entity_class = entity_class
        self.domain_name = domain_name
        
    def _create_error_context(self, operation: str, **kwargs) -> ErrorContext:
        """Create error context for operations."""
        return ErrorContext(
            domain=self.domain_name,
            operation=operation,
            metadata=kwargs
        )
    
    def _to_entity(self, data: Dict[str, Any]) -> T:
        """
        Convert database record to entity.
        
        Override this method in subclasses if custom conversion is needed.
        """
        return self.entity_class(**data)
    
    def _from_entity(self, entity: T) -> Dict[str, Any]:
        """
        Convert entity to database record.
        
        Override this method in subclasses if custom conversion is needed.
        """
        if hasattr(entity, '__dict__'):
            return entity.__dict__
        elif hasattr(entity, 'dict'):
            return entity.dict()
        else:
            raise InternalError(
                f"Cannot convert entity of type {type(entity)} to dict",
                context=self._create_error_context("entity_conversion")
            )
    
    async def get_by_id(self, entity_id: str) -> Optional[T]:
        """Retrieve an entity by its ID."""
        try:
            response = self.client.table(self.table_name).select("*").eq("id", entity_id).single().execute()
            
            if response.data:
                return self._to_entity(response.data)
            return None
            
        except Exception as e:
            if "No rows found" in str(e):
                return None
            
            logger.error(f"Error getting {self.table_name} by id {entity_id}: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message=f"Failed to get {self.table_name} by id",
                context=self._create_error_context("get_by_id", entity_id=entity_id),
                inner_error=e
            )
    
    async def get_many(
        self,
        filters: Optional[Dict[str, Any]] = None,
        pagination: Optional[PaginationParams] = None,
        sort: Optional[List[SortParams]] = None
    ) -> QueryResult[T]:
        """Retrieve multiple entities with filtering, pagination, and sorting."""
        try:
            # Start building query
            query = self.client.table(self.table_name).select("*", count="exact")
            
            # Apply filters
            if filters:
                for field, value in filters.items():
                    if value is not None:
                        if isinstance(value, (list, tuple)):
                            query = query.in_(field, value)
                        else:
                            query = query.eq(field, value)
            
            # Apply sorting
            if sort:
                for sort_param in sort:
                    ascending = sort_param.direction == SortDirection.ASC
                    query = query.order(sort_param.field, desc=not ascending)
            else:
                # Default sort by created_at if available
                query = query.order("created_at", desc=True)
            
            # Apply pagination
            if pagination:
                query = query.range(
                    pagination.offset,
                    pagination.offset + pagination.limit - 1
                )
            else:
                pagination = PaginationParams()
                query = query.range(0, 19)  # Default to first 20
            
            # Execute query
            response = query.execute()
            
            # Convert to entities
            items = [self._to_entity(item) for item in response.data]
            
            return QueryResult(
                items=items,
                total=response.count or len(items),
                page=pagination.page,
                page_size=pagination.page_size
            )
            
        except Exception as e:
            logger.error(f"Error querying {self.table_name}: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message=f"Failed to query {self.table_name}",
                context=self._create_error_context("get_many", filters=filters),
                inner_error=e
            )
    
    async def create(self, entity: T) -> T:
        """Create a new entity."""
        try:
            data = self._from_entity(entity)
            
            # Remove id if it's None (let database generate it)
            if 'id' in data and data['id'] is None:
                del data['id']
            
            response = self.client.table(self.table_name).insert(data).execute()
            
            if response.data and len(response.data) > 0:
                return self._to_entity(response.data[0])
            
            raise InternalError(
                "No data returned from insert operation",
                context=self._create_error_context("create")
            )
            
        except Exception as e:
            logger.error(f"Error creating {self.table_name}: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message=f"Failed to create {self.table_name}",
                context=self._create_error_context("create"),
                inner_error=e
            )
    
    async def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[T]:
        """Update an existing entity."""
        try:
            # Remove None values and id from updates
            clean_updates = {k: v for k, v in updates.items() if v is not None and k != 'id'}
            
            if not clean_updates:
                # Nothing to update
                return await self.get_by_id(entity_id)
            
            response = self.client.table(self.table_name).update(clean_updates).eq("id", entity_id).execute()
            
            if response.data and len(response.data) > 0:
                return self._to_entity(response.data[0])
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating {self.table_name} {entity_id}: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message=f"Failed to update {self.table_name}",
                context=self._create_error_context("update", entity_id=entity_id),
                inner_error=e
            )
    
    async def delete(self, entity_id: str) -> bool:
        """Delete an entity."""
        try:
            response = self.client.table(self.table_name).delete().eq("id", entity_id).execute()
            
            # Supabase returns deleted rows
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"Error deleting {self.table_name} {entity_id}: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message=f"Failed to delete {self.table_name}",
                context=self._create_error_context("delete", entity_id=entity_id),
                inner_error=e
            )
    
    async def exists(self, entity_id: str) -> bool:
        """Check if an entity exists."""
        try:
            response = self.client.table(self.table_name).select("id").eq("id", entity_id).execute()
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"Error checking existence of {self.table_name} {entity_id}: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message=f"Failed to check existence of {self.table_name}",
                context=self._create_error_context("exists", entity_id=entity_id),
                inner_error=e
            )
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count entities matching filters."""
        try:
            query = self.client.table(self.table_name).select("*", count="exact", head=True)
            
            if filters:
                for field, value in filters.items():
                    if value is not None:
                        query = query.eq(field, value)
            
            response = query.execute()
            return response.count or 0
            
        except Exception as e:
            logger.error(f"Error counting {self.table_name}: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message=f"Failed to count {self.table_name}",
                context=self._create_error_context("count", filters=filters),
                inner_error=e
            )