"""
API File Watcher for Automated Schema Updates

Monitors backend routes and controllers for changes,
automatically updates schema, and triggers frontend updates.
"""

import json
import logging
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Callable, Optional
from watchfiles import watch, DefaultIgnores

from .extractor import APISchemaExtractor
from .config import MonitorConfig

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class APIWatcher:
    """
    Monitors backend API routes for changes and triggers schema updates.
    
    Features:
    - File system watching
    - Schema change detection
    - Changelog generation
    - Frontend update notifications
    """
    
    def __init__(
        self,
        routes_dir: str,
        controller_dir: str = None,
        schema_file: str = "schema_registry.json",
        config: MonitorConfig = None,
        on_change_callback: Optional[Callable] = None
    ):
        """
        Initialize watcher.
        
        Args:
            routes_dir: Path to routes directory
            controller_dir: Path to controller directory
            schema_file: Output schema file path
            config: Monitor configuration
            on_change_callback: Callback function when changes detected
        """
        self.routes_dir = routes_dir
        self.controller_dir = controller_dir
        self.schema_file = schema_file
        self.config = config or MonitorConfig()
        self.on_change_callback = on_change_callback
        
        self.extractor = APISchemaExtractor(routes_dir, controller_dir)
        self.last_schema = self._load_current_schema()
        self.changelog_file = Path(schema_file).parent / "routes_changelog.json"
        
        logger.info(f"Initialized APIWatcher for {routes_dir}")
    
    def _load_current_schema(self) -> Dict:
        """Load the previous schema or return empty."""
        try:
            return self.extractor.load_schema(self.schema_file)
        except FileNotFoundError:
            logger.info("No previous schema found, starting fresh")
            return {"endpoints": [], "generated_at": None}
    
    def start_watching(self, poll_delay: float = 0.5, timeout: int = None):
        """
        Start watching for file changes.
        
        Args:
            poll_delay: Delay between file system polls (seconds)
            timeout: Timeout in seconds (None for infinite)
        """
        logger.info(f"Starting to watch {self.routes_dir}")
        
        ignore_patterns = DefaultIgnores | set(self.config.ignore_patterns)
        watch_paths = [self.routes_dir]
        if self.controller_dir:
            watch_paths.append(self.controller_dir)
        
        start_time = time.time() if timeout else None
        
        try:
            for changes in watch(
                *watch_paths,
                watch_filter=lambda change: self._should_process(change),
                ignore=ignore_patterns,
                poll_delay=poll_delay,
            ):
                if timeout and (time.time() - start_time) > timeout:
                    logger.info("Watcher timeout reached, stopping")
                    break
                
                self._on_changes_detected(changes)
        
        except KeyboardInterrupt:
            logger.info("Watcher stopped by user")
        except Exception as e:
            logger.error(f"Error in watcher: {e}", exc_info=True)
    
    def _should_process(self, change: tuple) -> bool:
        """Determine if a file change should trigger processing."""
        try:
            change_type, path = change
            # Only watch .py files in configured directories
            if not path.endswith(".py"):
                return False
            
            path_str = str(path).lower()
            return any(
                dir_name.lower() in path_str 
                for dir_name in self.config.watch_paths
            )
        except Exception:
            return False
    
    def _on_changes_detected(self, changes):
        """Handle detected file changes."""
        try:
            logger.debug(f"File changes detected: {changes}")
            
            # Extract new schema
            new_schema = self.extractor.extract_all_routes()
            
            # Compare with previous
            diff = self.extractor.compare_schemas(self.last_schema, new_schema)
            
            if self._has_meaningful_changes(diff):
                logger.info(f"API changes detected: {json.dumps(diff, indent=2)}")
                
                # Save new schema
                self.extractor.save_schema(self.schema_file)
                logger.info(f"Schema saved to {self.schema_file}")
                
                # Generate changelog
                self._generate_changelog(diff, new_schema)
                
                # Trigger callback if provided
                if self.on_change_callback:
                    try:
                        self.on_change_callback(diff, new_schema)
                    except Exception as e:
                        logger.error(f"Error in change callback: {e}", exc_info=True)
                
                # Update last schema
                self.last_schema = new_schema
        
        except Exception as e:
            logger.error(f"Error processing changes: {e}", exc_info=True)
    
    def _has_meaningful_changes(self, diff: Dict) -> bool:
        """Check if there are meaningful changes."""
        return any([
            diff.get("added"),
            diff.get("removed"),
            diff.get("modified")
        ])
    
    def _generate_changelog(self, diff: Dict, new_schema: Dict):
        """Generate and save changelog entry."""
        try:
            changelog_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "changes": diff,
                "summary": self._generate_summary(diff),
                "schema_version": new_schema.get("version", "unknown")
            }
            
            # Load existing changelog or create new
            try:
                with open(self.changelog_file, 'r') as f:
                    changelog = json.load(f)
                    if not isinstance(changelog, list):
                        changelog = [changelog]
            except FileNotFoundError:
                changelog = []
            
            # Append new entry
            changelog.append(changelog_entry)
            
            # Keep only last 100 entries
            changelog = changelog[-100:]
            
            # Save changelog
            self.changelog_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.changelog_file, 'w') as f:
                json.dump(changelog, f, indent=2)
            
            logger.info(f"Changelog updated: {self.changelog_file}")
        
        except Exception as e:
            logger.error(f"Error generating changelog: {e}", exc_info=True)
    
    def _generate_summary(self, diff: Dict) -> str:
        """Generate human-readable summary of changes."""
        added = len(diff.get("added", []))
        removed = len(diff.get("removed", []))
        modified = len(diff.get("modified", []))
        
        parts = []
        if added:
            parts.append(f"{added} endpoint(s) added")
        if removed:
            parts.append(f"{removed} endpoint(s) removed")
        if modified:
            parts.append(f"{modified} endpoint(s) modified")
        
        return ", ".join(parts) or "No changes"
    
    def trigger_frontend_update(self, schema: Dict = None):
        """
        Manually trigger frontend code generation.
        
        Args:
            schema: Schema to use for generation (uses last_schema if None)
        """
        schema = schema or self.last_schema
        logger.info("Triggering frontend code generation...")
        
        # This would call frontend generators
        # For now, just log
        logger.info(f"Would generate frontend code from schema with {len(schema.get('endpoints', []))} endpoints")
    
    def get_changes_since(self, timestamp: str) -> Dict:
        """Get all schema changes since a specific timestamp."""
        try:
            with open(self.changelog_file, 'r') as f:
                changelog = json.load(f)
            
            recent = []
            for entry in changelog:
                if entry.get("timestamp", "") >= timestamp:
                    recent.append(entry)
            
            return {
                "count": len(recent),
                "changes": recent
            }
        except FileNotFoundError:
            return {"count": 0, "changes": []}


class ChangeNotifier:
    """Handles notifications for API changes."""
    
    def __init__(self, webhook_url: Optional[str] = None):
        """
        Initialize notifier.
        
        Args:
            webhook_url: Optional webhook URL for notifications
        """
        self.webhook_url = webhook_url
    
    def notify(self, event_type: str, diff: Dict, schema: Dict):
        """
        Send notification about changes.
        
        Args:
            event_type: Type of change (added_endpoint, removed_endpoint, etc)
            diff: Change diff
            schema: Updated schema
        """
        logger.info(f"Notification: {event_type} - {diff}")
        
        if self.webhook_url:
            self._send_webhook(event_type, diff, schema)
    
    def _send_webhook(self, event_type: str, diff: Dict, schema: Dict):
        """Send webhook notification."""
        try:
            import requests
            
            payload = {
                "event": event_type,
                "timestamp": datetime.utcnow().isoformat(),
                "changes": diff,
                "endpoints_count": len(schema.get("endpoints", []))
            }
            
            response = requests.post(self.webhook_url, json=payload, timeout=5)
            logger.info(f"Webhook sent: {response.status_code}")
        
        except ImportError:
            logger.warning("requests library not installed, skipping webhook")
        except Exception as e:
            logger.error(f"Error sending webhook: {e}")


def start_monitoring(
    routes_dir: str = "./routes",
    controller_dir: str = "./controller",
    schema_file: str = "./schema_registry.json",
    config_file: str = None
):
    """
    Start API monitoring.
    
    Args:
        routes_dir: Path to routes directory
        controller_dir: Path to controller directory
        schema_file: Output schema file path
        config_file: Optional configuration file path
    """
    # Load configuration
    config = MonitorConfig()
    if config_file:
        config = MonitorConfig.from_json(config_file)
    
    if not config.enabled:
        logger.info("Monitoring is disabled in configuration")
        return
    
    # Create watcher
    watcher = APIWatcher(
        routes_dir=routes_dir,
        controller_dir=controller_dir,
        schema_file=schema_file,
        config=config
    )
    
    # Start watching
    watcher.start_watching()


if __name__ == "__main__":
    import sys
    
    routes_dir = sys.argv[1] if len(sys.argv) > 1 else "./routes"
    controller_dir = sys.argv[2] if len(sys.argv) > 2 else "./controller"
    
    logger.info("Starting API Watcher...")
    logger.info(f"Routes directory: {routes_dir}")
    logger.info(f"Controller directory: {controller_dir}")
    
    start_monitoring(routes_dir=routes_dir, controller_dir=controller_dir)
