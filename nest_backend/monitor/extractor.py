"""
API Schema Extractor for FastAPI Applications

This module provides functionality to extract API endpoints, models,
and metadata from FastAPI applications and generate schema documents.
"""

import ast
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, field, asdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Parameter:
    """Represents an endpoint parameter."""
    name: str
    type: str = "Any"
    required: bool = True
    description: str = ""
    enum: List[Any] = field(default_factory=list)


@dataclass
class Endpoint:
    """Represents a FastAPI endpoint."""
    method: str
    path: str
    function_name: str
    parameters: List[Parameter] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    description: str = ""
    requires_auth: bool = False
    response_model: str = ""


@dataclass
class APISchema:
    """Represents the complete API schema."""
    version: str = "1.0.0"
    title: str = "API Schema"
    generated_at: str = ""
    endpoints: List[Dict[str, Any]] = field(default_factory=list)
    models: List[Dict[str, Any]] = field(default_factory=list)
    changes: Dict[str, List[str]] = field(default_factory=lambda: {
        "added": [],
        "removed": [],
        "modified": []
    })


class APISchemaExtractor:
    """
    Extracts API endpoint metadata from FastAPI route files.
    
    Features:
    - Parse FastAPI decorators
    - Extract endpoint metadata
    - Generate schema documents
    - Compare schema versions
    """
    
    def __init__(self, routes_dir: str, controller_dir: str = None):
        """
        Initialize extractor.
        
        Args:
            routes_dir: Path to routes directory
            controller_dir: Path to controller directory (optional)
        """
        self.routes_dir = Path(routes_dir)
        self.controller_dir = Path(controller_dir) if controller_dir else None
        self.schema = APISchema()
        self.schema.generated_at = datetime.utcnow().isoformat()
    
    def extract_all_routes(self, title: str = "API Schema") -> Dict[str, Any]:
        """
        Extract all routes from Python files.
        
        Args:
            title: Title for the schema
        
        Returns:
            Dictionary containing the complete schema
        """
        self.schema.title = title
        endpoints = []
        
        # Extract from routes directory
        if self.routes_dir.exists():
            endpoints.extend(self._extract_from_directory(self.routes_dir))
        
        # Extract from controller directory if provided
        if self.controller_dir and self.controller_dir.exists():
            endpoints.extend(self._extract_from_directory(self.controller_dir))
        
        self.schema.endpoints = [asdict(ep) if isinstance(ep, Endpoint) else ep for ep in endpoints]
        self.schema.generated_at = datetime.utcnow().isoformat()
        
        logger.info(f"Extracted {len(endpoints)} endpoints from routes")
        return asdict(self.schema)
    
    def _extract_from_directory(self, directory: Path) -> List[Endpoint]:
        """Extract endpoints from all Python files in a directory."""
        endpoints = []
        
        for py_file in directory.glob("*.py"):
            if py_file.name.startswith("_"):
                continue
            
            try:
                file_endpoints = self._extract_from_file(py_file)
                endpoints.extend(file_endpoints)
            except Exception as e:
                logger.warning(f"Error parsing {py_file}: {e}")
        
        return endpoints
    
    def _extract_from_file(self, filepath: Path) -> List[Endpoint]:
        """Extract endpoints from a single Python file."""
        endpoints = []
        content = filepath.read_text(encoding='utf-8')
        
        try:
            tree = ast.parse(content)
        except SyntaxError as e:
            logger.warning(f"Syntax error in {filepath}: {e}")
            return endpoints
        
        # Find all router instances
        routers = self._find_routers(tree)
        
        # Find all endpoints
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                endpoint = self._parse_function(node, routers, content)
                if endpoint:
                    endpoints.append(endpoint)
        
        return endpoints
    
    def _find_routers(self, tree: ast.AST) -> Dict[str, str]:
        """Find all router variable assignments."""
        routers = {}
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        # Check if it's a router assignment
                        if isinstance(node.value, ast.Call):
                            if isinstance(node.value.func, ast.Name):
                                if node.value.func.id in ["APIRouter"]:
                                    routers[target.id] = "APIRouter"
        
        return routers
    
    def _parse_function(self, func: ast.FunctionDef, routers: Dict, content: str) -> Optional[Endpoint]:
        """Parse a function to extract endpoint metadata."""
        
        for decorator in func.decorator_list:
            endpoint = self._parse_decorator(decorator, func)
            if endpoint:
                return endpoint
        
        return None
    
    def _parse_decorator(self, decorator: ast.expr, func: ast.FunctionDef) -> Optional[Endpoint]:
        """Parse a decorator to extract endpoint information."""
        try:
            # Handle @router.get("/path"), @router.post("/path"), etc.
            if isinstance(decorator, ast.Call):
                if isinstance(decorator.func, ast.Attribute):
                    method = decorator.func.attr  # 'get', 'post', 'put', 'delete', 'patch'
                    
                    # Only process HTTP method decorators
                    if method.lower() not in ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']:
                        return None
                    
                    # Extract path from first argument
                    path = None
                    if decorator.args:
                        path_arg = decorator.args[0]
                        if isinstance(path_arg, ast.Constant):
                            path = path_arg.value
                    
                    if path is None:
                        return None
                    
                    # Extract parameters
                    parameters = self._extract_parameters(func)
                    
                    # Extract tags
                    tags = self._extract_tags(decorator)
                    
                    # Check if requires authentication
                    requires_auth = self._check_auth_dependency(func)
                    
                    # Extract docstring
                    description = ast.get_docstring(func) or ""
                    
                    return Endpoint(
                        method=method.upper(),
                        path=path,
                        function_name=func.name,
                        parameters=parameters,
                        tags=tags,
                        description=description,
                        requires_auth=requires_auth
                    )
        
        except Exception as e:
            logger.debug(f"Error parsing decorator: {e}")
        
        return None
    
    def _extract_parameters(self, func: ast.FunctionDef) -> List[Parameter]:
        """Extract function parameters and their types."""
        parameters = []
        
        for arg in func.args.args:
            param = Parameter(name=arg.arg)
            
            # Try to extract annotation
            if arg.annotation:
                param.type = ast.unparse(arg.annotation)
            
            parameters.append(param)
        
        return parameters
    
    def _extract_tags(self, decorator: ast.Call) -> List[str]:
        """Extract tags from decorator."""
        tags = []
        
        for keyword in decorator.keywords:
            if keyword.arg == "tags":
                if isinstance(keyword.value, ast.List):
                    for elt in keyword.value.elts:
                        if isinstance(elt, ast.Constant):
                            tags.append(elt.value)
        
        return tags
    
    def _check_auth_dependency(self, func: ast.FunctionDef) -> bool:
        """Check if function requires authentication."""
        source = ast.unparse(func)
        return "get_current_user" in source or "Depends(get_current_user)" in source
    
    def compare_schemas(self, old_schema: Dict, new_schema: Dict) -> Dict:
        """
        Compare two schemas and identify changes.
        
        Args:
            old_schema: Previous schema
            new_schema: Current schema
        
        Returns:
            Dictionary with added, removed, and modified endpoints
        """
        changes = {
            "added": [],
            "removed": [],
            "modified": []
        }
        
        # Create endpoint keys for comparison
        old_endpoints = {
            f"{e['method']} {e['path']}": e 
            for e in old_schema.get("endpoints", [])
        }
        new_endpoints = {
            f"{e['method']} {e['path']}": e 
            for e in new_schema.get("endpoints", [])
        }
        
        # Find added endpoints
        for key in new_endpoints:
            if key not in old_endpoints:
                changes["added"].append(new_endpoints[key])
        
        # Find removed endpoints
        for key in old_endpoints:
            if key not in new_endpoints:
                changes["removed"].append(old_endpoints[key])
        
        # Find modified endpoints
        for key in old_endpoints:
            if key in new_endpoints:
                if old_endpoints[key] != new_endpoints[key]:
                    changes["modified"].append({
                        "endpoint": key,
                        "old": old_endpoints[key],
                        "new": new_endpoints[key]
                    })
        
        return changes
    
    def save_schema(self, output_path: str) -> None:
        """Save schema to JSON file."""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(asdict(self.schema), f, indent=2)
        
        logger.info(f"Schema saved to {output_path}")
    
    def load_schema(self, path: str) -> Dict:
        """Load schema from JSON file."""
        with open(path, 'r') as f:
            return json.load(f)
    
    def generate_summary(self, schema: Dict) -> str:
        """Generate a human-readable summary of the schema."""
        endpoints = schema.get("endpoints", [])
        methods = {}
        
        for endpoint in endpoints:
            method = endpoint.get("method")
            methods[method] = methods.get(method, 0) + 1
        
        summary_parts = []
        for method, count in sorted(methods.items()):
            summary_parts.append(f"{method}: {count}")
        
        return f"Total endpoints: {len(endpoints)} ({', '.join(summary_parts)})"


# Convenience function for quick extraction
def extract_api_schema(routes_dir: str, controller_dir: str = None) -> Dict[str, Any]:
    """Quick function to extract API schema."""
    extractor = APISchemaExtractor(routes_dir, controller_dir)
    return extractor.extract_all_routes()


if __name__ == "__main__":
    # Test extraction
    extractor = APISchemaExtractor("./routes", "./controller")
    schema = extractor.extract_all_routes(title="EPICS API")
    
    print("=" * 60)
    print("API SCHEMA EXTRACTION RESULTS")
    print("=" * 60)
    print(json.dumps(schema, indent=2))
    print("\n" + extractor.generate_summary(schema))
