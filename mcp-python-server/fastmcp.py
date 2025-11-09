"""Minimal local fallback for the `fastmcp` package used in tests.

The upstream `fastmcp` dependency is not available in the execution
environment used for continuous integration.  The real package provides a
Model Context Protocol (MCP) helper that exposes a `.tool()` decorator and a
`.run()` entry point for serving registered tools.  For the purposes of our
test-suite we only need to register callables so they can be imported from the
`server` module; the networked serving functionality is not exercised.

This lightweight shim mirrors the handful of behaviours that the server module
expects while remaining dependency free.  It keeps the public API compatible
with the real library so that swapping back to the PyPI package in production
remains trivial.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Optional

ToolCallable = Callable[..., Any]


@dataclass
class FastMCP:
    """Drop-in stub that captures tool registrations.

    The decorator simply returns the original function so the surrounding code
    keeps working exactly the same way.  Registered tools are stored in the
    ``tools`` dictionary for potential inspection during testing.
    """

    name: str
    tools: Dict[str, ToolCallable] = field(default_factory=dict)

    def tool(self, name: Optional[str] = None) -> Callable[[ToolCallable], ToolCallable]:
        """Register a callable as an MCP tool.

        Parameters
        ----------
        name:
            Optional explicit name to register the tool under.  When omitted we
            use the function's ``__name__`` attribute, matching the behaviour of
            the upstream implementation.
        """

        def decorator(func: ToolCallable) -> ToolCallable:
            tool_name = name or func.__name__
            self.tools[tool_name] = func
            return func

        return decorator

    # The integration tests import functions directly from ``server`` and do
    # not start the interactive server.  Providing a no-op ``run`` keeps the
    # API surface compatible with the real library while remaining safe to call
    # in environments where networking/event loops are undesirable.
    def run(self) -> None:  # pragma: no cover - intentionally inert
        """Placeholder entry point to match the real ``FastMCP`` API."""
        print(f"FastMCP stub '{self.name}' is running without network support.")
