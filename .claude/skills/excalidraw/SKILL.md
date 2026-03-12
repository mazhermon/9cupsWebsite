---
name: excalidraw
description: Generate Excalidraw diagram JSON files. Use when the user wants to visualise architecture, workflows, data flows, or system design. Diagrams should argue and reveal relationships, not just display information.
---

# Excalidraw Diagram Generator

## Core philosophy
Diagrams should **ARGUE, not DISPLAY**. The visual structure itself should communicate meaning.

**Isomorphism Test**: Remove all text from the diagram. Does the structure alone communicate the concept? If not, redesign.

## Depth assessment
Before designing, determine:
- **Simple/Conceptual**: Abstract shapes for mental models, philosophy, high-level overviews
- **Comprehensive/Technical**: Concrete examples, real specs, real event names, actual API shapes

Technical diagrams require researching actual specifications before drawing.

## Design process (always follow this order)
1. Assess depth required
2. Understand the concept deeply — look up real specs if technical
3. Map concepts to visual patterns (fan-out, convergence, tree, spiral, assembly line)
4. Ensure visual variety — not all boxes
5. Sketch the flow mentally
6. Generate JSON section by section for large diagrams

## Visual rules
- Default to free-floating text; containers only when structurally needed
- Shape meaning: ellipses = start/end, diamonds = decisions, rectangles = processes
- Roughness: 0 for modern clean diagrams
- Keep <30% of text elements inside containers
- Use lines as primary structure for timelines and trees

## Large diagram strategy
Build section by section. Use descriptive ID strings. Namespace seeds by section. Update cross-section bindings incrementally.

## Render & validate
After generating JSON, render to PNG and visually inspect. Fix text clipping, overlaps, and layout issues before delivering.

## Output
Produce valid Excalidraw JSON wrapped in a code block. The user can paste it directly into excalidraw.com.
