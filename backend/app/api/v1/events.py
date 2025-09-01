from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio

from app.core.db import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.community import Event
from app.services.event_scraper import EventScraperService
from app.services.event_relevance import EventRelevanceService
from app.schemas.community import EventResponse, EventCreate, LocationUpdate
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[EventResponse])
async def get_events(
    background_tasks: BackgroundTasks,
    auto_refresh: bool = Query(True, description="Auto-refresh events from external sources"),
    radius_km: int = Query(50, description="Search radius in kilometers"),
    personalized: bool = Query(True, description="Filter events by user interests"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get events, optionally filtered by user location and interests, auto-refreshed"""
    
    # If user has location and auto_refresh is enabled, fetch new events in background
    if (auto_refresh and current_user.latitude and current_user.longitude):
        background_tasks.add_task(
            refresh_events_for_location,
            current_user.latitude,
            current_user.longitude,
            radius_km,
            db
        )
    
    # Get existing events from database
    query = db.query(Event).filter(
        Event.starts_at >= datetime.utcnow()
    ).order_by(Event.starts_at)
    
    # Filter by location if user has coordinates
    if current_user.latitude and current_user.longitude:
        # Simple bounding box filter (in production, use proper geospatial queries)
        lat_range = radius_km / 111.0  # Rough km to degrees conversion
        lon_range = radius_km / (111.0 * abs(current_user.latitude))
        
        query = query.filter(
            Event.latitude.between(
                current_user.latitude - lat_range,
                current_user.latitude + lat_range
            ),
            Event.longitude.between(
                current_user.longitude - lon_range,
                current_user.longitude + lon_range
            )
        )
    
    events = query.limit(100).all()  # Get more events for filtering
    
    # Apply relevance filtering if requested
    if personalized:
        relevance_service = EventRelevanceService()
        scored_events = relevance_service.filter_and_rank_events(events, current_user, db)
        # Return top 50 most relevant events
        return [EventResponse.from_orm(item['event']) for item in scored_events[:50]]
    
    return [EventResponse.from_orm(event) for event in events[:50]]

@router.post("/", response_model=EventResponse)
async def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new community event"""
    
    db_event = Event(
        title=event.title,
        description=event.description,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        link=event.link,
        location_name=event.location_name,
        location_address=event.location_address,
        latitude=event.latitude,
        longitude=event.longitude,
        is_online=event.is_online,
        is_free=event.is_free,
        category=event.category,
        author_id=current_user.id,
        source='user_created'
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    return EventResponse.from_orm(db_event)

@router.post("/refresh")
async def refresh_events(
    background_tasks: BackgroundTasks,
    radius_km: int = Query(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually refresh events from external sources"""
    
    if not current_user.latitude or not current_user.longitude:
        raise HTTPException(
            status_code=400,
            detail="User location not set. Please update your location first."
        )
    
    # Start background task to fetch events
    background_tasks.add_task(
        refresh_events_for_location,
        current_user.latitude,
        current_user.longitude,
        radius_km,
        db
    )
    
    return {"message": "Event refresh started in background"}

@router.put("/location")
async def update_user_location(
    location: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user's location for event recommendations"""
    
    current_user.latitude = location.latitude
    current_user.longitude = location.longitude
    current_user.city = location.city
    current_user.country = location.country
    current_user.timezone_name = location.timezone_name
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Location updated successfully"}

@router.get("/categories")
async def get_event_categories():
    """Get available event categories"""
    return {
        "categories": [
            "tech", "business", "startup", "conference", "workshop", 
            "meetup", "networking", "hackathon", "webinar", "training"
        ]
    }

async def refresh_events_for_location(latitude: float, longitude: float, radius_km: int, db: Session):
    """Background task to refresh events for a specific location"""
    try:
        scraper = EventScraperService()
        events = await scraper.fetch_events_by_location(latitude, longitude, radius_km)
        
        if events:
            await scraper.store_events_in_db(events, db)
            logger.info(f"Refreshed {len(events)} events for location {latitude}, {longitude}")
        else:
            logger.info(f"No new events found for location {latitude}, {longitude}")
            
    except Exception as e:
        logger.error(f"Failed to refresh events: {e}")

@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an event (only if user created it or is admin)"""
    
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check permissions
    if event.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")
    
    db.delete(event)
    db.commit()
    
    return {"message": "Event deleted successfully"}

@router.get("/nearby")
async def get_nearby_events(
    latitude: float = Query(..., description="User latitude"),
    longitude: float = Query(..., description="User longitude"),
    radius_km: int = Query(25, description="Search radius in kilometers"),
    limit: int = Query(20, description="Maximum number of events to return"),
    db: Session = Depends(get_db)
):
    """Get events near a specific location (public endpoint)"""
    
    # Simple bounding box calculation
    lat_range = radius_km / 111.0
    lon_range = radius_km / (111.0 * abs(latitude))
    
    events = db.query(Event).filter(
        Event.starts_at >= datetime.utcnow(),
        Event.latitude.between(latitude - lat_range, latitude + lat_range),
        Event.longitude.between(longitude - lon_range, longitude + lon_range)
    ).order_by(Event.starts_at).limit(limit).all()
    
    return [EventResponse.from_orm(event) for event in events]
