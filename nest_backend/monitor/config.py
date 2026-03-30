"""
Configuration for API Monitoring System
"""

import json
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, asdict


@dataclass
class MonitorConfig:
    """Configuration for API monitoring system."""
    
    # Monitoring settings
    enabled: bool = True
    watch_paths: List[str] = None
    ignore_patterns: List[str] = None
    check_interval_ms: int = 2000
    debounce_ms: int = 500
    
    # Extraction settings
    include_docstrings: bool = True
    include_models: bool = True
    generate_openapi: bool = True
    
    # Frontend generation
    target_frontend_path: str = "../src"
    generate_hooks: bool = True
    generate_types: bool = True
    generate_templates: bool = True
    auto_update: bool = False
    
    # Sync settings
    frontend_sync_interval_ms: int = 60000
    alert_on_mismatch: bool = True
    auto_fetch_schema: bool = True
    
    # Notification settings
    console_log: bool = True
    webhook_url: str = None
    webhook_events: List[str] = None
    
    def __post_init__(self):
        """Initialize default values."""
        if self.watch_paths is None:
            self.watch_paths = ["routes", "controller", "azure_plant_service"]
        
        if self.ignore_patterns is None:
            self.ignore_patterns = ["*.pyc", "__pycache__", "*.log", ".pytest_cache"]
        
        if self.webhook_events is None:
            self.webhook_events = ["added_endpoint", "removed_endpoint", "breaking_change"]
    
    @classmethod
    def from_json(cls, path: str) -> "MonitorConfig":
        """Load configuration from JSON file."""
        try:
            with open(path, 'r') as f:
                data = json.load(f)
                return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        except FileNotFoundError:
            return cls()
    
    def to_json(self, path: str) -> None:
        """Save configuration to JSON file."""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w') as f:
            json.dump(asdict(self), f, indent=2)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


# Default configuration instance
default_config = MonitorConfig()
