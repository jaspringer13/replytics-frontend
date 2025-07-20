"""
Migration: Set up test phone number for admin account
Assigns (256) 809-0055 to jaspringer13@gmail.com
"""

import asyncio
from datetime import datetime
from supabase import create_client, Client
import os

# Test phone number details
TEST_PHONE_NUMBER = "+12568090055"  # E.164 format
TEST_DISPLAY_NAME = "Test Location"
ADMIN_EMAIL = "jaspringer13@gmail.com"

# Twilio test SID (for development)
TEST_TWILIO_SID = "PN_TEST_256_809_0055"
TEST_TWILIO_ACCOUNT_SID = "AC_TEST_ACCOUNT"


async def run_migration():
    """Set up test phone number for admin account"""
    # Initialize Supabase client
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print(f"Setting up test phone number {TEST_PHONE_NUMBER} for {ADMIN_EMAIL}")
    
    try:
        # 1. Find the admin user
        user_result = supabase.table("users").select("id").eq("email", ADMIN_EMAIL).single().execute()
        if not user_result.data:
            print(f"User {ADMIN_EMAIL} not found. Creating...")
            # Create user if not exists
            user_result = supabase.table("users").insert({
                "email": ADMIN_EMAIL,
                "role": "admin",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        
        user_id = user_result.data["id"]
        print(f"Found user ID: {user_id}")
        
        # 2. Find or create the business for this user
        business_result = supabase.table("businesses").select("id").eq("owner_id", user_id).single().execute()
        if not business_result.data:
            print("Creating business for admin user...")
            business_result = supabase.table("businesses").insert({
                "name": "Test Business",
                "owner_id": user_id,
                "email": ADMIN_EMAIL,
                "phone": TEST_PHONE_NUMBER,  # Legacy field
                "timezone": "America/Chicago",  # 256 is Alabama area code
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
        
        business_id = business_result.data["id"]
        print(f"Found business ID: {business_id}")
        
        # 3. Check if phone number already exists
        existing_phone = supabase.table("phone_numbers")\
            .select("id")\
            .eq("phone_number", TEST_PHONE_NUMBER)\
            .single()\
            .execute()
        
        if existing_phone.data:
            print(f"Phone number {TEST_PHONE_NUMBER} already exists")
            return
        
        # 4. Create the phone number record
        phone_data = {
            "id": "test-phone-001",
            "business_id": business_id,
            "phone_number": TEST_PHONE_NUMBER,
            "twilio_metadata": {
                "sid": TEST_TWILIO_SID,
                "account_sid": TEST_TWILIO_ACCOUNT_SID,
                "friendly_name": f"Test - {TEST_DISPLAY_NAME}",
                "capabilities": ["voice", "sms"],
                "voice_url": "https://api.replytics.com/webhooks/twilio/voice/incoming",
                "voice_method": "POST",
                "sms_url": "https://api.replytics.com/webhooks/twilio/sms/incoming",
                "sms_method": "POST"
            },
            "display_name": TEST_DISPLAY_NAME,
            "description": "Test phone number for development",
            "address": {
                "city": "Huntsville",
                "state": "AL",
                "country": "US"
            },
            "timezone": "America/Chicago",
            "voice_settings": {
                "voice_id": "kdmDKE6EkgrWrrykO9Qt"
            },
            "conversation_rules": {
                "allow_multiple_services": True,
                "allow_cancellations": True,
                "allow_rescheduling": True,
                "no_show_block_enabled": False,
                "no_show_threshold": 3
            },
            "operating_hours": [
                {"day_of_week": 0, "open_time": "10:00", "close_time": "18:00", "is_closed": False},  # Sunday
                {"day_of_week": 1, "open_time": "09:00", "close_time": "20:00", "is_closed": False},  # Monday
                {"day_of_week": 2, "open_time": "09:00", "close_time": "20:00", "is_closed": False},  # Tuesday
                {"day_of_week": 3, "open_time": "09:00", "close_time": "20:00", "is_closed": False},  # Wednesday
                {"day_of_week": 4, "open_time": "09:00", "close_time": "20:00", "is_closed": False},  # Thursday
                {"day_of_week": 5, "open_time": "09:00", "close_time": "20:00", "is_closed": False},  # Friday
                {"day_of_week": 6, "open_time": "10:00", "close_time": "18:00", "is_closed": False},  # Saturday
            ],
            "status": "active",
            "is_primary": True,
            "sms_enabled": True,
            "sms_reminder_hours": 24,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "activated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("phone_numbers").insert(phone_data).execute()
        print(f"Successfully created phone number: {TEST_PHONE_NUMBER}")
        print(f"Phone ID: {result.data['id']}")
        
        # 5. Update the business to have this as the primary phone (for backward compatibility)
        supabase.table("businesses").update({
            "phone": TEST_PHONE_NUMBER,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", business_id).execute()
        
        print("Migration completed successfully!")
        print(f"\nTest phone number {TEST_PHONE_NUMBER} has been assigned to {ADMIN_EMAIL}")
        print(f"Business ID: {business_id}")
        print(f"Phone configuration:")
        print(f"  - Display Name: {TEST_DISPLAY_NAME}")
        print(f"  - Timezone: America/Chicago")
        print(f"  - Voice Agent: Enabled")
        print(f"  - SMS: Enabled")
        
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(run_migration())