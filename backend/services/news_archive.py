"""
news_archive.py — News Archiving Service
Refactored to store daily news archives in the main database rather than writing separate Excel files.
Inherits from BaseNewsArchive to ensure clean architectural abstractions.
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta, timezone

from database.db import SessionLocal
import database.crud as db_crud

try:
    from models import NewsItem
except ImportError:
    pass

class BaseNewsArchive:
    """Abstract base class for news archiving system. Allows swapping storage backends later."""
    
    def archive_news(self, news_items: List['NewsItem']) -> int:
        raise NotImplementedError
        
    def get_by_date(self, date_str: str) -> List[Dict]:
        """date_str in YYYY-MM-DD format"""
        raise NotImplementedError

    def get_by_date_range(self, start_date: str, end_date: str) -> List[Dict]:
        """start_date, end_date in YYYY-MM-DD format"""
        raise NotImplementedError
        
    def get_available_dates(self) -> List[str]:
        raise NotImplementedError


class DbNewsArchive(BaseNewsArchive):
    """
    SQLAlchemy-backed implementation of the news archiving system.
    Stores and queries all archived items in the unified database.
    """
    
    def archive_news(self, news_items: List['NewsItem']) -> int:
        if not news_items:
            return 0
            
        news_dicts = []
        for item in news_items:
            if not item.published:
                continue
                
            sentiment_val = getattr(item, "sentiment", "NEUTRAL")
            if hasattr(sentiment_val, "value"):
                sentiment_val = sentiment_val.value
            sentiment_val = str(sentiment_val).upper().replace("SENTIMENTTYPE.", "")
                
            news_dicts.append({
                "headline": item.title.strip(),
                "summary": "",
                "source": item.source.strip(),
                "url": item.url.strip(),
                "published": item.published,
                "sentiment": sentiment_val,
                "impact_score": float(getattr(item, "sentiment_score", 0.0)),
                "category": getattr(item, "category", "General"),
                "related_symbols": getattr(item, "related_symbols", []),
            })
            
        with SessionLocal() as db:
            added = db_crud.create_news_articles_batch(db, news_dicts)
        return added

    def get_by_date(self, date_str: str) -> List[Dict]:
        with SessionLocal() as db:
            articles = db_crud.get_news_by_date(db, date_str)
            
        output = []
        for art in articles:
            related = art.related_symbols.split(",") if art.related_symbols else []
            output.append({
                "title": art.headline,
                "source": art.source,
                "url": art.url,
                "published": art.published.strftime("%Y-%m-%d %H:%M:%S") if isinstance(art.published, datetime) else str(art.published),
                "sentiment": art.sentiment,
                "sentiment_score": float(art.impact_score),
                "category": art.category,
                "related_symbols": related
            })
        return output

    def get_by_date_range(self, start_date: str, end_date: str) -> List[Dict]:
        with SessionLocal() as db:
            articles = db_crud.get_news_by_date_range(db, start_date, end_date)
            
        output = []
        for art in articles:
            related = art.related_symbols.split(",") if art.related_symbols else []
            output.append({
                "title": art.headline,
                "source": art.source,
                "url": art.url,
                "published": art.published.strftime("%Y-%m-%d %H:%M:%S") if isinstance(art.published, datetime) else str(art.published),
                "sentiment": art.sentiment,
                "sentiment_score": float(art.impact_score),
                "category": art.category,
                "related_symbols": related
            })
        return output

    def get_available_dates(self) -> List[str]:
        with SessionLocal() as db:
            return db_crud.get_news_available_dates(db)


news_archive_service = DbNewsArchive()
