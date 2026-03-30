"""
API Monitoring and Synchronization System

This module provides automated monitoring of FastAPI routes,
schema extraction, and frontend synchronization capabilities.
"""

__version__ = "1.0.0"
__author__ = "EPICS Team"

from .config import MonitorConfig
from .extractor import APISchemaExtractor
from .watcher import APIWatcher

__all__ = ["MonitorConfig", "APISchemaExtractor", "APIWatcher"]
