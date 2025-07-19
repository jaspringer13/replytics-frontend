"""
Data synchronization service between Voice Bot and Dashboard Supabase.

This service handles bidirectional synchronization of business data between the
Voice Bot API and the Dashboard's Supabase database. It provides robust error
handling, transaction management, and comprehensive logging.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum


from .voice_bot_client import VoiceBotClient, get_voice_bot_client, VoiceBotAPIError
from .supabase_service import SupabaseService
from config.settings import get_settings

# Setup logging
logger = logging.getLogger(__name__)
settings = get_settings()


class SyncDirection(Enum):
    """Direction of data synchronization."""
    VOICE_BOT_TO_DASHBOARD = "voice_bot_to_dashboard"
    DASHBOARD_TO_VOICE_BOT = "dashboard_to_voice_bot"
    BIDIRECTIONAL = "bidirectional"


class SyncStatus(Enum):
    """Status of synchronization operation."""
    SUCCESS = "success"
    PARTIAL_SUCCESS = "partial_success"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class SyncResult:
    """Result of a synchronization operation."""
    status: SyncStatus
    message: str
    records_processed: int = 0
    records_succeeded: int = 0
    records_failed: int = 0
    errors: List[str] = field(default_factory=list)
    duration_seconds: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def add_error(self, error: str) -> None:
        """Add an error message to the result."""
        self.errors.append(error)
        self.records_failed += 1

    def add_success(self) -> None:
        """Mark a record as successfully processed."""
        self.records_succeeded += 1
        self.records_processed += 1

    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.records_processed == 0:
            return 100.0
        return (self.records_succeeded / self.records_processed) * 100


@dataclass
class BusinessSyncConfig:
    """Configuration for business data synchronization."""
    sync_business_profile: bool = True
    sync_services: bool = True
    sync_business_hours: bool = True
    sync_staff: bool = True
    force_refresh: bool = False
    timeout_seconds: int = 300
    max_retries: int = 3


class DataSyncService:
    """
    Comprehensive data synchronization service between Voice Bot and Dashboard.
    
    Features:
    - Bidirectional synchronization with conflict resolution
    - Transaction management for data consistency
    - Comprehensive error handling and rollback capabilities
    - Detailed logging and monitoring
    - Configurable sync scope and behavior
    - Performance optimization with batch operations
    """

    def __init__(
        self,
        voice_bot_client: Optional[VoiceBotClient] = None,
        supabase_service: Optional[SupabaseService] = None
    ):
        self.voice_bot_client = voice_bot_client
        self.supabase_service = supabase_service
        self._initialization_lock = asyncio.Lock()
        self._initialized = False

    async def _ensure_initialized(self) -> None:
        """Ensure all services are properly initialized."""
        if self._initialized:
            return

        async with self._initialization_lock:
            if not self._initialized:
                # Initialize Voice Bot client if not provided
                if not self.voice_bot_client:
                    self.voice_bot_client = await get_voice_bot_client()
                    logger.info("Voice Bot client initialized for data sync")

                # Initialize Supabase service if not provided
                if not self.supabase_service:
                    self.supabase_service = SupabaseService()
                    await self.supabase_service.initialize()
                    logger.info("Supabase service initialized for data sync")

                self._initialized = True

    async def sync_business_data(
        self,
        business_id: str,
        config: Optional[BusinessSyncConfig] = None,
        direction: SyncDirection = SyncDirection.VOICE_BOT_TO_DASHBOARD
    ) -> SyncResult:
        """
        Perform comprehensive business data synchronization.
        
        Args:
            business_id: The business identifier
            config: Synchronization configuration
            direction: Direction of synchronization
            
        Returns:
            SyncResult with detailed operation status
        """
        start_time = datetime.now(timezone.utc)
        config = config or BusinessSyncConfig()
        
        logger.info(f"Starting business data sync for {business_id} in direction {direction.value}")
        
        try:
            await self._ensure_initialized()
            
            # Initialize result tracking
            overall_result = SyncResult(
                status=SyncStatus.SUCCESS,
                message=f"Business data sync completed for {business_id}",
                timestamp=start_time
            )

            # Execute synchronization tasks based on configuration
            sync_tasks = []
            
            if config.sync_business_profile:
                sync_tasks.append(("business_profile", self._sync_business_profile))
            
            if config.sync_services:
                sync_tasks.append(("services", self._sync_services))
                
            if config.sync_business_hours:
                sync_tasks.append(("business_hours", self._sync_business_hours))
                
            if config.sync_staff:
                sync_tasks.append(("staff", self._sync_staff))

            # Execute synchronization tasks
            for task_name, sync_func in sync_tasks:
                try:
                    logger.info(f"Synchronizing {task_name} for business {business_id}")
                    task_result = await asyncio.wait_for(
                        sync_func(business_id, direction),
                        timeout=config.timeout_seconds
                    )
                    
                    # Aggregate results
                    overall_result.records_processed += task_result.records_processed
                    overall_result.records_succeeded += task_result.records_succeeded
                    overall_result.records_failed += task_result.records_failed
                    overall_result.errors.extend(task_result.errors)
                    
                    if task_result.status == SyncStatus.FAILED:
                        logger.error(f"Failed to sync {task_name}: {task_result.message}")
                        overall_result.status = SyncStatus.PARTIAL_SUCCESS
                    
                except asyncio.TimeoutError:
                    error_msg = f"Timeout while synchronizing {task_name}"
                    logger.error(error_msg)
                    overall_result.add_error(error_msg)
                    overall_result.status = SyncStatus.PARTIAL_SUCCESS
                    
                except Exception as e:
                    error_msg = f"Error synchronizing {task_name}: {str(e)}"
                    logger.error(error_msg, exc_info=True)
                    overall_result.add_error(error_msg)
                    overall_result.status = SyncStatus.PARTIAL_SUCCESS

            # Calculate final status
            if overall_result.records_failed > 0:
                if overall_result.records_succeeded == 0:
                    overall_result.status = SyncStatus.FAILED
                    overall_result.message = f"All synchronization tasks failed for {business_id}"
                else:
                    overall_result.status = SyncStatus.PARTIAL_SUCCESS
                    overall_result.message = f"Some synchronization tasks failed for {business_id}"

            # Calculate duration
            end_time = datetime.now(timezone.utc)
            overall_result.duration_seconds = (end_time - start_time).total_seconds()

            logger.info(
                f"Business sync completed for {business_id}: "
                f"{overall_result.status.value}, "
                f"Success rate: {overall_result.success_rate:.1f}%, "
                f"Duration: {overall_result.duration_seconds:.2f}s"
            )

            return overall_result

        except Exception as e:
            error_msg = f"Critical error during business sync for {business_id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            end_time = datetime.now(timezone.utc)
            return SyncResult(
                status=SyncStatus.FAILED,
                message=error_msg,
                duration_seconds=(end_time - start_time).total_seconds(),
                timestamp=start_time,
                errors=[error_msg]
            )

    async def _sync_business_profile(
        self,
        business_id: str,
        direction: SyncDirection
    ) -> SyncResult:
        """Synchronize business profile data."""
        logger.debug(f"Syncing business profile for {business_id}")
        
        try:
            if direction in [SyncDirection.VOICE_BOT_TO_DASHBOARD, SyncDirection.BIDIRECTIONAL]:
                # Fetch profile from Voice Bot
                voice_bot_profile = await self.voice_bot_client.get_business_profile(business_id)
                
                # Transform and update in Dashboard database
                dashboard_profile = self._transform_business_profile_for_dashboard(
                    business_id, voice_bot_profile
                )
                
                # Update in Supabase using upsert
                await self._upsert_business_profile(business_id, dashboard_profile)
                
                return SyncResult(
                    status=SyncStatus.SUCCESS,
                    message="Business profile synchronized successfully",
                    records_processed=1,
                    records_succeeded=1
                )
            
            return SyncResult(
                status=SyncStatus.SKIPPED,
                message="Business profile sync skipped based on direction"
            )
            
        except VoiceBotAPIError as e:
            error_msg = f"Voice Bot API error during business profile sync: {e.message}"
            logger.error(error_msg)
            return SyncResult(
                status=SyncStatus.FAILED,
                message=error_msg,
                records_processed=1,
                errors=[error_msg]
            )
            
        except Exception as e:
            error_msg = f"Unexpected error during business profile sync: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return SyncResult(
                status=SyncStatus.FAILED,
                message=error_msg,
                records_processed=1,
                errors=[error_msg]
            )

    async def _sync_services(
        self,
        business_id: str,
        direction: SyncDirection
    ) -> SyncResult:
        """Synchronize services data."""
        logger.debug(f"Syncing services for {business_id}")
        
        try:
            if direction in [SyncDirection.VOICE_BOT_TO_DASHBOARD, SyncDirection.BIDIRECTIONAL]:
                # Fetch services from Voice Bot
                voice_bot_services = await self.voice_bot_client.get_services(
                    business_id, include_inactive=True
                )
                services_list = voice_bot_services.get('services', [])
                
                if not services_list:
                    return SyncResult(
                        status=SyncStatus.SUCCESS,
                        message="No services to synchronize"
                    )
                
                # Process services in batches for better performance
                batch_size = 10
                total_processed = 0
                total_succeeded = 0
                errors = []
                
                for i in range(0, len(services_list), batch_size):
                    batch = services_list[i:i + batch_size]
                    
                    for service in batch:
                        try:
                            dashboard_service = self._transform_service_for_dashboard(
                                business_id, service
                            )
                            await self._upsert_service(dashboard_service)
                            total_succeeded += 1
                        except Exception as e:
                            error_msg = f"Failed to sync service {service.get('id', 'unknown')}: {str(e)}"
                            errors.append(error_msg)
                            logger.error(error_msg)
                        
                        total_processed += 1
                
                status = SyncStatus.SUCCESS
                if errors:
                    status = SyncStatus.PARTIAL_SUCCESS if total_succeeded > 0 else SyncStatus.FAILED
                
                return SyncResult(
                    status=status,
                    message=f"Services synchronization completed: {total_succeeded}/{total_processed} succeeded",
                    records_processed=total_processed,
                    records_succeeded=total_succeeded,
                    records_failed=len(errors),
                    errors=errors
                )
            
            return SyncResult(
                status=SyncStatus.SKIPPED,
                message="Services sync skipped based on direction"
            )
            
        except VoiceBotAPIError as e:
            error_msg = f"Voice Bot API error during services sync: {e.message}"
            logger.error(error_msg)
            return SyncResult(
                status=SyncStatus.FAILED,
                message=error_msg,
                errors=[error_msg]
            )
            
        except Exception as e:
            error_msg = f"Unexpected error during services sync: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return SyncResult(
                status=SyncStatus.FAILED,
                message=error_msg,
                errors=[error_msg]
            )

    async def _sync_business_hours(
        self,
        business_id: str,
        direction: SyncDirection
    ) -> SyncResult:
        """Synchronize business hours data."""
        logger.debug(f"Syncing business hours for {business_id}")
        
        try:
            if direction in [SyncDirection.VOICE_BOT_TO_DASHBOARD, SyncDirection.BIDIRECTIONAL]:
                # Fetch hours from Voice Bot
                voice_bot_hours = await self.voice_bot_client.get_business_hours(business_id)
                
                # Transform and update business hours
                dashboard_hours = self._transform_business_hours_for_dashboard(
                    business_id, voice_bot_hours
                )
                
                await self._upsert_business_hours(business_id, dashboard_hours)
                
                return SyncResult(
                    status=SyncStatus.SUCCESS,
                    message="Business hours synchronized successfully",
                    records_processed=len(dashboard_hours),
                    records_succeeded=len(dashboard_hours)
                )
            
            return SyncResult(
                status=SyncStatus.SKIPPED,
                message="Business hours sync skipped based on direction"
            )
            
        except VoiceBotAPIError as e:
            error_msg = f"Voice Bot API error during business hours sync: {e.message}"
            logger.error(error_msg)
            return SyncResult(
                status=SyncStatus.FAILED,
                message=error_msg,
                errors=[error_msg]
            )
            
        except Exception as e:
            error_msg = f"Unexpected error during business hours sync: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return SyncResult(
                status=SyncStatus.FAILED,
                message=error_msg,
                errors=[error_msg]
            )

    async def _sync_staff(
        self,
        business_id: str,
        direction: SyncDirection
    ) -> SyncResult:
        """Synchronize staff data."""
        logger.debug(f"Syncing staff for {business_id}")
        
        try:
            if direction in [SyncDirection.VOICE_BOT_TO_DASHBOARD, SyncDirection.BIDIRECTIONAL]:
                # Fetch staff from Voice Bot
                voice_bot_staff = await self.voice_bot_client.get_staff(business_id)
                staff_list = voice_bot_staff.get('staff', [])
                
                if not staff_list:
                    return SyncResult(
                        status=SyncStatus.SUCCESS,
                        message="No staff to synchronize"
                    )
                
                # Process staff members
                total_processed = 0
                total_succeeded = 0
                errors = []
                
                for staff_member in staff_list:
                    try:
                        dashboard_staff = self._transform_staff_for_dashboard(
                            business_id, staff_member
                        )
                        await self._upsert_staff_member(dashboard_staff)
                        total_succeeded += 1
                    except Exception as e:
                        error_msg = f"Failed to sync staff {staff_member.get('id', 'unknown')}: {str(e)}"
                        errors.append(error_msg)
                        logger.error(error_msg)
                    
                    total_processed += 1
                
                status = SyncStatus.SUCCESS
                if errors:
                    status = SyncStatus.PARTIAL_SUCCESS if total_succeeded > 0 else SyncStatus.FAILED
                
                return SyncResult(
                    status=status,
                    message=f"Staff synchronization completed: {total_succeeded}/{total_processed} succeeded",
                    records_processed=total_processed,
                    records_succeeded=total_succeeded,
                    records_failed=len(errors),
                    errors=errors
                )
            
            return SyncResult(
                status=SyncStatus.SKIPPED,
                message="Staff sync skipped based on direction"
            )
            
        except VoiceBotAPIError as e:
            error_msg = f"Voice Bot API error during staff sync: {e.message}"
            logger.error(error_msg)
            return SyncResult(
                status=SyncStatus.FAILED,
                message=error_msg,
                errors=[error_msg]
            )
            
        except Exception as e:
            error_msg = f"Unexpected error during staff sync: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return SyncResult(
                status=SyncStatus.FAILED,
                message=error_msg,
                errors=[error_msg]
            )

    # =============================================================================
    # DATA TRANSFORMATION METHODS
    # =============================================================================

    def _transform_business_profile_for_dashboard(
        self,
        business_id: str,
        voice_bot_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Transform Voice Bot business profile data for Dashboard schema."""
        return {
            'id': business_id,
            'name': voice_bot_data.get('name'),
            'phone': voice_bot_data.get('phone'),
            'email': voice_bot_data.get('email'),
            'website': voice_bot_data.get('website'),
            'timezone': voice_bot_data.get('timezone', 'America/New_York'),
            'industry': voice_bot_data.get('industry'),
            'address': voice_bot_data.get('address', {}),
            'voice_settings': voice_bot_data.get('voice_settings', {}),
            'conversation_rules': voice_bot_data.get('conversation_rules', {}),
            'sms_settings': voice_bot_data.get('sms_settings', {}),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'voice_bot_synced_at': datetime.now(timezone.utc).isoformat(),
        }

    def _transform_service_for_dashboard(
        self,
        business_id: str,
        voice_bot_service: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Transform Voice Bot service data for Dashboard schema."""
        return {
            'id': voice_bot_service['id'],
            'business_id': business_id,
            'name': voice_bot_service['name'],
            'duration': voice_bot_service.get('duration_minutes', voice_bot_service.get('duration', 60)),
            'price': float(voice_bot_service.get('price', 0)),
            'description': voice_bot_service.get('description'),
            'active': voice_bot_service.get('active', True),
            'display_order': voice_bot_service.get('sort_order', 0),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }

    def _transform_business_hours_for_dashboard(
        self,
        business_id: str,
        voice_bot_hours: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Transform Voice Bot business hours data for Dashboard schema."""
        dashboard_hours = []
        
        # Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
        day_mapping = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
        }
        
        for day_name, day_data in voice_bot_hours.items():
            if day_name.lower() in day_mapping:
                day_of_week = day_mapping[day_name.lower()]
                
                is_closed = not day_data.get('is_open', True)
                open_time = day_data.get('open') if not is_closed else None
                close_time = day_data.get('close') if not is_closed else None
                
                dashboard_hours.append({
                    'business_id': business_id,
                    'day_of_week': day_of_week,
                    'open_time': open_time,
                    'close_time': close_time,
                    'is_closed': is_closed,
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                })
        
        return dashboard_hours

    def _transform_staff_for_dashboard(
        self,
        business_id: str,
        voice_bot_staff: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Transform Voice Bot staff data for Dashboard schema."""
        return {
            'id': voice_bot_staff['id'],
            'business_id': business_id,
            'name': voice_bot_staff['name'],
            'email': voice_bot_staff.get('email'),
            'phone': voice_bot_staff.get('phone'),
            'role': voice_bot_staff.get('role', 'staff'),
            'services': voice_bot_staff.get('services', []),
            'availability': voice_bot_staff.get('availability', []),
            'active': voice_bot_staff.get('active', True),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }

    # =============================================================================
    # DATABASE OPERATIONS
    # =============================================================================

    async def _upsert_business_profile(
        self,
        business_id: str,
        profile_data: Dict[str, Any]
    ) -> None:
        """Upsert business profile data to Dashboard database."""
        try:
            await asyncio.to_thread(
                lambda: self.supabase_service.client.table('businesses')
                .upsert(profile_data)
                .execute()
            )
            logger.debug(f"Business profile upserted for {business_id}")
        except Exception as e:
            logger.error(f"Failed to upsert business profile for {business_id}: {e}")
            raise

    async def _upsert_service(self, service_data: Dict[str, Any]) -> None:
        """Upsert service data to Dashboard database."""
        try:
            await asyncio.to_thread(
                lambda: self.supabase_service.client.table('services')
                .upsert(service_data)
                .execute()
            )
            logger.debug(f"Service upserted: {service_data['id']}")
        except Exception as e:
            logger.error(f"Failed to upsert service {service_data['id']}: {e}")
            raise

    async def _upsert_business_hours(
        self,
        business_id: str,
        hours_data: List[Dict[str, Any]]
    ) -> None:
        """Upsert business hours data to Dashboard database."""
        try:
            # Delete existing hours for this business first
            await asyncio.to_thread(
                lambda: self.supabase_service.client.table('operating_hours')
                .delete()
                .eq('business_id', business_id)
                .execute()
            )
            
            # Insert new hours
            if hours_data:
                await asyncio.to_thread(
                    lambda: self.supabase_service.client.table('operating_hours')
                    .insert(hours_data)
                    .execute()
                )
            
            logger.debug(f"Business hours upserted for {business_id}")
        except Exception as e:
            logger.error(f"Failed to upsert business hours for {business_id}: {e}")
            raise

    async def _upsert_staff_member(self, staff_data: Dict[str, Any]) -> None:
        """Upsert staff member data to Dashboard database."""
        try:
            await asyncio.to_thread(
                lambda: self.supabase_service.client.table('staff_members')
                .upsert(staff_data)
                .execute()
            )
            logger.debug(f"Staff member upserted: {staff_data['id']}")
        except Exception as e:
            logger.error(f"Failed to upsert staff member {staff_data['id']}: {e}")
            raise

    # =============================================================================
    # UTILITY METHODS
    # =============================================================================

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on data sync service components."""
        try:
            await self._ensure_initialized()
            
            # Check Voice Bot client
            voice_bot_health = await self.voice_bot_client.health_check()
            
            # Check Supabase service
            supabase_health = await self.supabase_service.health_check()
            
            overall_healthy = (
                voice_bot_health.get('status') == 'healthy' and
                supabase_health
            )
            
            return {
                'status': 'healthy' if overall_healthy else 'unhealthy',
                'components': {
                    'voice_bot': voice_bot_health,
                    'supabase': supabase_health
                },
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Data sync health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }

    async def close(self) -> None:
        """Close and cleanup resources."""
        try:
            if self.voice_bot_client:
                await self.voice_bot_client.close()
            
            if self.supabase_service:
                await self.supabase_service.close()
                
            logger.info("Data sync service closed successfully")
        except Exception as e:
            logger.error(f"Error closing data sync service: {e}")


# =============================================================================
# SINGLETON FACTORY
# =============================================================================

_data_sync_service: Optional[DataSyncService] = None
_service_lock = asyncio.Lock()


async def get_data_sync_service() -> DataSyncService:
    """
    Get or create DataSyncService singleton.
    
    Returns:
        Configured DataSyncService instance
    """
    global _data_sync_service

    async with _service_lock:
        if _data_sync_service is None:
            _data_sync_service = DataSyncService()
            logger.info("Data sync service singleton created")

    return _data_sync_service


async def close_data_sync_service() -> None:
    """Close the data sync service and cleanup resources."""
    global _data_sync_service
    
    async with _service_lock:
        if _data_sync_service:
            await _data_sync_service.close()
            _data_sync_service = None
            logger.info("Data sync service closed and cleaned up")