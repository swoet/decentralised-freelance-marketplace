import os
import redis
import logging
from typing import Generator

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

def publish_event(channel: str, message: str):
    try:
        r = redis.from_url(REDIS_URL)
        r.publish(channel, message)
        r.close()
    except Exception as e:
        logging.error(f"Failed to publish event to {channel}: {e}")

def subscribe_events(channel: str) -> Generator[str, None, None]:
    try:
        r = redis.from_url(REDIS_URL)
        pubsub = r.pubsub()
        pubsub.subscribe(channel)
        try:
            for message in pubsub.listen():
                if message['type'] == 'message':
                    yield message['data'].decode()
        finally:
            pubsub.unsubscribe(channel)
            r.close()
    except Exception as e:
        logging.error(f"Failed to subscribe to {channel}: {e}")
        return

class RedisPubSubService:
    def __init__(self):
        self.redis_url = REDIS_URL
        self.redis_client = None
    
    def get_client(self):
        if not self.redis_client:
            self.redis_client = redis.from_url(self.redis_url)
        return self.redis_client
    
    def publish(self, channel: str, message: str):
        client = self.get_client()
        return client.publish(channel, message)
    
    def subscribe(self, channel: str):
        client = self.get_client()
        pubsub = client.pubsub()
        pubsub.subscribe(channel)
        return pubsub
    
    def close(self):
        if self.redis_client:
            self.redis_client.close() 