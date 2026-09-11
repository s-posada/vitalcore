"""
engine_registry.py - Registro global desacoplado para el motor de búsqueda semántica.
Permite a main.py, agent.py y mcp_server.py acceder a la misma instancia de VectorSearchEngine
sin generar ciclos de importación.
"""
from typing import Any, Optional

_engine: Optional[Any] = None


def set_engine(engine: Any) -> None:
    """Registra la instancia global del motor de búsqueda vectorial."""
    global _engine
    _engine = engine


def get_engine() -> Any:
    """Retorna la instancia global del motor de búsqueda vectorial."""
    global _engine
    return _engine
