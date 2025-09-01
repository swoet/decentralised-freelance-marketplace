import asyncio
import aiohttp
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.community import Event
import logging

logger = logging.getLogger(__name__)

class EventScraperService:
    """Service to scrape and fetch real IT/business events from various sources"""
    
    def __init__(self):
        self.eventbrite_api_key = os.getenv('EVENTBRITE_API_KEY')
        self.meetup_api_key = os.getenv('MEETUP_API_KEY')
        
    async def fetch_events_by_location(self, latitude: float, longitude: float, radius_km: int = 50) -> List[Dict]:
        """Fetch events near the specified location"""
        events = []
        
        # Fetch from multiple sources in parallel
        tasks = [
            self._fetch_eventbrite_events(latitude, longitude, radius_km),
            self._fetch_meetup_events(latitude, longitude, radius_km),
            self._fetch_tech_conferences(latitude, longitude, radius_km),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                events.extend(result)
            elif isinstance(result, Exception):
                logger.warning(f"Event fetch failed: {result}")
        
        # Filter and deduplicate events
        filtered_events = self._filter_relevant_events(events)
        return self._deduplicate_events(filtered_events)
    
    async def _fetch_eventbrite_events(self, lat: float, lon: float, radius_km: int) -> List[Dict]:
        """Fetch events from Eventbrite API"""
        if not self.eventbrite_api_key:
            return []
            
        url = "https://www.eventbriteapi.com/v3/events/search/"
        params = {
            'location.latitude': lat,
            'location.longitude': lon,
            'location.within': f"{radius_km}km",
            'categories': '102,103,113',  # Technology, Business, Science & Tech
            'start_date.range_start': datetime.now().isoformat(),
            'start_date.range_end': (datetime.now() + timedelta(days=90)).isoformat(),
            'sort_by': 'date',
            'expand': 'venue,organizer'
        }
        
        headers = {'Authorization': f'Bearer {self.eventbrite_api_key}'}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_eventbrite_events(data.get('events', []))
        except Exception as e:
            logger.error(f"Eventbrite API error: {e}")
        
        return []
    
    async def _fetch_meetup_events(self, lat: float, lon: float, radius_km: int) -> List[Dict]:
        """Fetch events from Meetup API"""
        # Note: Meetup API requires OAuth, implementing basic structure
        events = []
        
        # Fallback: Use public Meetup data or other tech event sources
        tech_keywords = ['javascript', 'python', 'react', 'blockchain', 'ai', 'startup', 'business']
        
        for keyword in tech_keywords[:3]:  # Limit API calls
            try:
                # This would use Meetup's GraphQL API or similar
                # For now, return mock data structure
                mock_events = await self._get_mock_tech_events(keyword, lat, lon)
                events.extend(mock_events)
            except Exception as e:
                logger.error(f"Meetup fetch error for {keyword}: {e}")
        
        return events
    
    async def _fetch_tech_conferences(self, lat: float, lon: float, radius_km: int) -> List[Dict]:
        """Fetch from tech conference aggregators and known sources"""
        events = []
        
        # Known tech event sources
        sources = [
            'https://confs.tech/json',  # Tech conferences JSON feed
            # Add more sources as needed
        ]
        
        async with aiohttp.ClientSession() as session:
            for source in sources:
                try:
                    async with session.get(source, timeout=10) as response:
                        if response.status == 200:
                            data = await response.json()
                            parsed = self._parse_tech_conferences(data, lat, lon, radius_km)
                            events.extend(parsed)
                except Exception as e:
                    logger.error(f"Tech conference fetch error from {source}: {e}")
        
        return events
    
    def _parse_eventbrite_events(self, events: List[Dict]) -> List[Dict]:
        """Parse Eventbrite API response into standard format"""
        parsed = []
        
        for event in events:
            try:
                parsed_event = {
                    'id': f"eb_{event['id']}",
                    'title': event['name']['text'],
                    'description': event.get('description', {}).get('text', ''),
                    'start_time': event['start']['utc'],
                    'end_time': event['end']['utc'],
                    'url': event['url'],
                    'location': self._extract_location(event.get('venue')),
                    'organizer': event.get('organizer', {}).get('name', ''),
                    'category': 'tech',
                    'source': 'eventbrite',
                    'is_online': event.get('online_event', False),
                    'is_free': event.get('is_free', False)
                }
                parsed.append(parsed_event)
            except Exception as e:
                logger.warning(f"Failed to parse Eventbrite event: {e}")
        
        return parsed
    
    async def _get_mock_tech_events(self, keyword: str, lat: float, lon: float) -> List[Dict]:
        """Generate mock tech events for development/fallback"""
        base_events = [
            {
                'title': f'{keyword.title()} Developers Meetup',
                'description': f'Monthly meetup for {keyword} developers and enthusiasts',
                'category': 'tech',
                'type': 'meetup'
            },
            {
                'title': f'{keyword.title()} Workshop',
                'description': f'Hands-on workshop covering latest {keyword} trends',
                'category': 'education',
                'type': 'workshop'
            }
        ]
        
        events = []
        for i, base in enumerate(base_events):
            event_date = datetime.now() + timedelta(days=7 + i * 14)
            events.append({
                'id': f"mock_{keyword}_{i}",
                'title': base['title'],
                'description': base['description'],
                'start_time': event_date.isoformat(),
                'end_time': (event_date + timedelta(hours=3)).isoformat(),
                'url': f'https://example.com/events/{keyword}-{i}',
                'location': {
                    'name': 'Tech Hub Downtown',
                    'address': 'Tech District',
                    'latitude': lat + (i * 0.01),
                    'longitude': lon + (i * 0.01)
                },
                'organizer': f'{keyword.title()} Community',
                'category': base['category'],
                'source': 'mock',
                'is_online': i % 2 == 0,
                'is_free': True
            })
        
        return events
    
    def _parse_tech_conferences(self, data: List[Dict], lat: float, lon: float, radius_km: int) -> List[Dict]:
        """Parse tech conference data"""
        events = []
        
        for conf in data:
            try:
                # Calculate distance (simplified)
                if self._is_within_radius(conf, lat, lon, radius_km):
                    events.append({
                        'id': f"conf_{conf.get('name', '').replace(' ', '_')}",
                        'title': conf.get('name', ''),
                        'description': f"Tech conference: {conf.get('topics', [])}",
                        'start_time': conf.get('startDate', ''),
                        'end_time': conf.get('endDate', ''),
                        'url': conf.get('url', ''),
                        'location': {
                            'name': conf.get('city', ''),
                            'address': f"{conf.get('city', '')}, {conf.get('country', '')}",
                            'latitude': lat,  # Would need geocoding
                            'longitude': lon
                        },
                        'category': 'conference',
                        'source': 'confs.tech',
                        'is_online': conf.get('online', False),
                        'is_free': False
                    })
            except Exception as e:
                logger.warning(f"Failed to parse conference: {e}")
        
        return events
    
    def _filter_relevant_events(self, events: List[Dict]) -> List[Dict]:
        """Filter events for IT/business relevance"""
        tech_keywords = [
            'javascript', 'python', 'react', 'vue', 'angular', 'node', 'blockchain',
            'ai', 'machine learning', 'data science', 'devops', 'cloud', 'aws',
            'startup', 'business', 'entrepreneur', 'freelance', 'remote work',
            'web development', 'mobile', 'api', 'microservices', 'docker'
        ]
        
        filtered = []
        for event in events:
            title_lower = event.get('title', '').lower()
            desc_lower = event.get('description', '').lower()
            
            # Check if event is relevant
            is_relevant = any(
                keyword in title_lower or keyword in desc_lower 
                for keyword in tech_keywords
            )
            
            # Also include events in tech/business categories
            category = event.get('category', '').lower()
            if category in ['tech', 'technology', 'business', 'startup', 'conference']:
                is_relevant = True
            
            if is_relevant:
                filtered.append(event)
        
        return filtered
    
    def _deduplicate_events(self, events: List[Dict]) -> List[Dict]:
        """Remove duplicate events based on title and date"""
        seen = set()
        unique_events = []
        
        for event in events:
            # Create a key based on title and start time
            key = (
                event.get('title', '').lower().strip(),
                event.get('start_time', '')[:10]  # Just the date part
            )
            
            if key not in seen:
                seen.add(key)
                unique_events.append(event)
        
        return unique_events
    
    def _extract_location(self, venue: Optional[Dict]) -> Dict:
        """Extract location info from venue data"""
        if not venue:
            return {'name': 'Online', 'address': '', 'latitude': None, 'longitude': None}
        
        return {
            'name': venue.get('name', ''),
            'address': venue.get('address', {}).get('localized_area_display', ''),
            'latitude': venue.get('latitude'),
            'longitude': venue.get('longitude')
        }
    
    def _is_within_radius(self, event: Dict, lat: float, lon: float, radius_km: int) -> bool:
        """Check if event is within specified radius (simplified)"""
        # This is a simplified check - in production, use proper geospatial calculations
        event_city = event.get('city', '').lower()
        
        # For now, just check if it's a major tech city
        major_cities = ['san francisco', 'new york', 'london', 'berlin', 'toronto', 'austin']
        return any(city in event_city for city in major_cities)

    async def store_events_in_db(self, events: List[Dict], db: Session):
        """Store fetched events in database"""
        for event_data in events:
            try:
                # Check if event already exists
                existing = db.query(Event).filter(
                    Event.external_id == event_data['id']
                ).first()
                
                if not existing:
                    event = Event(
                        title=event_data['title'],
                        description=event_data.get('description', ''),
                        external_id=event_data['id'],
                        external_url=event_data.get('url', ''),
                        starts_at=datetime.fromisoformat(event_data['start_time'].replace('Z', '+00:00')),
                        location_name=event_data.get('location', {}).get('name', ''),
                        location_address=event_data.get('location', {}).get('address', ''),
                        latitude=event_data.get('location', {}).get('latitude'),
                        longitude=event_data.get('location', {}).get('longitude'),
                        is_online=event_data.get('is_online', False),
                        is_free=event_data.get('is_free', True),
                        source=event_data.get('source', 'unknown'),
                        category=event_data.get('category', 'general')
                    )
                    db.add(event)
            except Exception as e:
                logger.error(f"Failed to store event {event_data.get('id')}: {e}")
        
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to commit events to database: {e}")
