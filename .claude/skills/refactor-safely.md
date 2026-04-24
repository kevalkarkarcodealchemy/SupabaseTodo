---
name: Refactor Safely
description: Plan and execute safe refactoring using dependency analysis
---

## Refactor Safely

Use the knowledge graph to plan and execute refactoring with confidence.

### Steps

1. Use `get_minimal_context(task="...")` to gather minimal context before refactoring.
2. Use `refactor_tool` with mode="suggest" for community-driven refactoring suggestions.
3. Use `refactor_tool` with mode="dead_code" to find unreferenced code.
4. For renames, use `refactor_tool` with mode="rename" to preview all affected locations.
5. Use `apply_refactor_tool` with the refactor_id to apply renames.
6. After changes, run `detect_changes` to verify the refactoring impact.

### Safety Checks

- Always preview before applying (rename mode gives you an edit list).
- Check `get_impact_radius` before major refactors.
- Use `get_affected_flows` to ensure no critical paths are broken.
- Run `find_large_functions` to identify decomposition targets.

## Token Efficiency Rules
- ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.
