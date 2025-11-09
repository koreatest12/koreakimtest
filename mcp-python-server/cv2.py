"""Lightweight stub for OpenCV used in the MCP server tests.

The GitHub Actions runner we target for smoke tests does not provide the
system libraries (``libGL.so`` et al.) required by the real ``cv2`` wheel.  To
keep the server importable we expose the tiny subset of symbols referenced by
the codebase and raise informative errors whenever an image processing helper
is actually invoked.

Projects that need the genuine OpenCV features should install ``opencv-python``
or ``opencv-python-headless`` in a fully featured environment.  The stub keeps
our tests hermetic without pulling in heavyweight native dependencies.
"""
from __future__ import annotations

from typing import Any

COLOR_BGR2GRAY = "COLOR_BGR2GRAY"


def _missing(function_name: str) -> None:
    raise RuntimeError(
        "OpenCV functionality is unavailable in the test environment. "
        f"Call to '{function_name}' requires installing 'opencv-python' with "
        "system library support."
    )


def imread(*args: Any, **kwargs: Any) -> Any:  # pragma: no cover - simple stub
    _missing("imread")


def mean(*args: Any, **kwargs: Any) -> Any:  # pragma: no cover - simple stub
    _missing("mean")


def cvtColor(*args: Any, **kwargs: Any) -> Any:  # pragma: no cover
    _missing("cvtColor")


def Canny(*args: Any, **kwargs: Any) -> Any:  # pragma: no cover
    _missing("Canny")


def imwrite(*args: Any, **kwargs: Any) -> Any:  # pragma: no cover
    _missing("imwrite")
