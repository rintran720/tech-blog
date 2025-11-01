"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pen,
  Square,
  Circle,
  Minus,
  ArrowRight,
  MousePointer2,
  Hand,
  Undo,
  Redo,
  Trash2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type Tool =
  | "pointer"
  | "hand"
  | "pen"
  | "arrow"
  | "rectangle"
  | "circle"
  | "line";

interface Point {
  x: number;
  y: number;
}

interface Drawing {
  id: string;
  tool: Tool;
  color: string;
  strokeWidth: number;
  points: Point[];
  startPoint?: Point;
  endPoint?: Point;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
}

interface Viewport {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null;

export default function ExcalidrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>("pointer");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null
  );
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [history, setHistory] = useState<Drawing[][]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [viewport, setViewport] = useState<Viewport>({
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  });
  const startPointRef = useRef<Point | null>(null);
  const lastPanPointRef = useRef<Point | null>(null);
  const dragOffsetRef = useRef<Point | null>(null);

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
  ];

  // Generate unique ID
  const generateId = () =>
    `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Transform screen coordinates to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      return {
        x: (screenX - viewport.offsetX) / viewport.zoom,
        y: (screenY - viewport.offsetY) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Transform world coordinates to screen coordinates
  const worldToScreen = useCallback(
    (worldX: number, worldY: number): Point => {
      return {
        x: worldX * viewport.zoom + viewport.offsetX,
        y: worldY * viewport.zoom + viewport.offsetY,
      };
    },
    [viewport]
  );

  // Draw a single shape
  const drawShape = (ctx: CanvasRenderingContext2D, drawing: Drawing) => {
    ctx.strokeStyle = drawing.color;
    ctx.fillStyle = drawing.color;
    ctx.lineWidth = drawing.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const isSelected = drawing.id === selectedDrawingId;
    if (isSelected) {
      ctx.strokeStyle = "#0066FF";
      ctx.lineWidth = drawing.strokeWidth + 1;
    }

    if (drawing.tool === "pen") {
      if (drawing.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
      }
      ctx.stroke();
    } else if (
      drawing.tool === "rectangle" &&
      drawing.startPoint &&
      drawing.endPoint
    ) {
      const x = Math.min(drawing.startPoint.x, drawing.endPoint.x);
      const y = Math.min(drawing.startPoint.y, drawing.endPoint.y);
      const width = Math.abs(drawing.endPoint.x - drawing.startPoint.x);
      const height = Math.abs(drawing.endPoint.y - drawing.startPoint.y);
      ctx.strokeRect(x, y, width, height);
    } else if (
      drawing.tool === "circle" &&
      drawing.startPoint &&
      drawing.endPoint
    ) {
      const radius = Math.sqrt(
        Math.pow(drawing.endPoint.x - drawing.startPoint.x, 2) +
          Math.pow(drawing.endPoint.y - drawing.startPoint.y, 2)
      );
      ctx.beginPath();
      ctx.arc(
        drawing.startPoint.x,
        drawing.startPoint.y,
        radius,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    } else if (
      drawing.tool === "line" &&
      drawing.startPoint &&
      drawing.endPoint
    ) {
      ctx.beginPath();
      ctx.moveTo(drawing.startPoint.x, drawing.startPoint.y);
      ctx.lineTo(drawing.endPoint.x, drawing.endPoint.y);
      ctx.stroke();
    } else if (
      drawing.tool === "arrow" &&
      drawing.startPoint &&
      drawing.endPoint
    ) {
      drawArrow(ctx, drawing.startPoint, drawing.endPoint);
    }
  };

  // Draw arrow
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point
  ) => {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle - arrowAngle),
      end.y - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle + arrowAngle),
      end.y - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  };

  // Draw selection and resize handles
  const drawSelection = (ctx: CanvasRenderingContext2D, drawingId: string) => {
    const drawing = drawings.find((d) => d.id === drawingId);
    if (!drawing) return;

    ctx.strokeStyle = "#0066FF";
    ctx.fillStyle = "#0066FF";
    ctx.lineWidth = 1 / viewport.zoom;
    ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);

    let bounds: { x: number; y: number; width: number; height: number };

    if (drawing.tool === "pen") {
      if (drawing.points.length === 0) return;
      const xs = drawing.points.map((p) => p.x);
      const ys = drawing.points.map((p) => p.y);
      bounds = {
        x: Math.min(...xs) - 5,
        y: Math.min(...ys) - 5,
        width: Math.max(...xs) - Math.min(...xs) + 10,
        height: Math.max(...ys) - Math.min(...ys) + 10,
      };
    } else if (drawing.startPoint && drawing.endPoint) {
      if (drawing.tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(drawing.endPoint.x - drawing.startPoint.x, 2) +
            Math.pow(drawing.endPoint.y - drawing.startPoint.y, 2)
        );
        bounds = {
          x: drawing.startPoint.x - radius - 5,
          y: drawing.startPoint.y - radius - 5,
          width: radius * 2 + 10,
          height: radius * 2 + 10,
        };
      } else {
        bounds = {
          x: Math.min(drawing.startPoint.x, drawing.endPoint.x) - 5,
          y: Math.min(drawing.startPoint.y, drawing.endPoint.y) - 5,
          width: Math.abs(drawing.endPoint.x - drawing.startPoint.x) + 10,
          height: Math.abs(drawing.endPoint.y - drawing.startPoint.y) + 10,
        };
      }
    } else {
      return;
    }

    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.setLineDash([]);

    // Draw resize handles
    const handleSize = 8 / viewport.zoom;
    const handles = [
      { x: bounds.x, y: bounds.y, pos: "nw" },
      { x: bounds.x + bounds.width, y: bounds.y, pos: "ne" },
      { x: bounds.x, y: bounds.y + bounds.height, pos: "sw" },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height, pos: "se" },
      { x: bounds.x + bounds.width / 2, y: bounds.y, pos: "n" },
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, pos: "s" },
      { x: bounds.x, y: bounds.y + bounds.height / 2, pos: "w" },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, pos: "e" },
    ];

    handles.forEach((handle) => {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
  };

  // Redraw all drawings
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply viewport transformation
    ctx.save();
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.zoom, viewport.zoom);

    drawings.forEach((drawing) => {
      drawShape(ctx, drawing);
    });

    // Draw selection and resize handles
    if (selectedDrawingId) {
      drawSelection(ctx, selectedDrawingId);
    }

    ctx.restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings, selectedDrawingId, viewport]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth - 400;
      canvas.height = window.innerHeight - 100;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [redrawCanvas]);

  // Check if point is inside drawing
  const isPointInDrawing = (point: Point, drawing: Drawing): boolean => {
    if (drawing.tool === "pen") {
      // Check if point is near any line segment
      for (let i = 0; i < drawing.points.length - 1; i++) {
        const p1 = drawing.points[i];
        const p2 = drawing.points[i + 1];
        const dist = distanceToLineSegment(point, p1, p2);
        if (dist < 10) return true;
      }
      return false;
    } else if (drawing.startPoint && drawing.endPoint) {
      if (drawing.tool === "circle") {
        const center = drawing.startPoint;
        const radius = Math.sqrt(
          Math.pow(drawing.endPoint.x - center.x, 2) +
            Math.pow(drawing.endPoint.y - center.y, 2)
        );
        const dist = Math.sqrt(
          Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
        );
        return Math.abs(dist - radius) < 10;
      } else {
        const x = Math.min(drawing.startPoint.x, drawing.endPoint.x);
        const y = Math.min(drawing.startPoint.y, drawing.endPoint.y);
        const width = Math.abs(drawing.endPoint.x - drawing.startPoint.x);
        const height = Math.abs(drawing.endPoint.y - drawing.startPoint.y);
        return (
          point.x >= x &&
          point.x <= x + width &&
          point.y >= y &&
          point.y <= y + height
        );
      }
    }
    return false;
  };

  // Distance from point to line segment
  const distanceToLineSegment = (p: Point, a: Point, b: Point): number => {
    const A = p.x - a.x;
    const B = p.y - a.y;
    const C = b.x - a.x;
    const D = b.y - a.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = a.x;
      yy = a.y;
    } else if (param > 1) {
      xx = b.x;
      yy = b.y;
    } else {
      xx = a.x + param * C;
      yy = a.y + param * D;
    }

    const dx = p.x - xx;
    const dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get resize handle at point
  const getResizeHandle = (point: Point, drawingId: string): ResizeHandle => {
    const drawing = drawings.find((d) => d.id === drawingId);
    if (!drawing || !drawing.startPoint || !drawing.endPoint) return null;

    let bounds: { x: number; y: number; width: number; height: number };

    if (drawing.tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(drawing.endPoint.x - drawing.startPoint.x, 2) +
          Math.pow(drawing.endPoint.y - drawing.startPoint.y, 2)
      );
      bounds = {
        x: drawing.startPoint.x - radius,
        y: drawing.startPoint.y - radius,
        width: radius * 2,
        height: radius * 2,
      };
    } else {
      bounds = {
        x: Math.min(drawing.startPoint.x, drawing.endPoint.x),
        y: Math.min(drawing.startPoint.y, drawing.endPoint.y),
        width: Math.abs(drawing.endPoint.x - drawing.startPoint.x),
        height: Math.abs(drawing.endPoint.y - drawing.startPoint.y),
      };
    }

    const handleSize = 8 / viewport.zoom;
    const tolerance = handleSize * 1.5;

    if (
      Math.abs(point.x - bounds.x) < tolerance &&
      Math.abs(point.y - bounds.y) < tolerance
    )
      return "nw";
    if (
      Math.abs(point.x - (bounds.x + bounds.width)) < tolerance &&
      Math.abs(point.y - bounds.y) < tolerance
    )
      return "ne";
    if (
      Math.abs(point.x - bounds.x) < tolerance &&
      Math.abs(point.y - (bounds.y + bounds.height)) < tolerance
    )
      return "sw";
    if (
      Math.abs(point.x - (bounds.x + bounds.width)) < tolerance &&
      Math.abs(point.y - (bounds.y + bounds.height)) < tolerance
    )
      return "se";
    if (
      Math.abs(point.x - (bounds.x + bounds.width / 2)) < tolerance &&
      Math.abs(point.y - bounds.y) < tolerance
    )
      return "n";
    if (
      Math.abs(point.x - (bounds.x + bounds.width / 2)) < tolerance &&
      Math.abs(point.y - (bounds.y + bounds.height)) < tolerance
    )
      return "s";
    if (
      Math.abs(point.x - bounds.x) < tolerance &&
      Math.abs(point.y - (bounds.y + bounds.height / 2)) < tolerance
    )
      return "w";
    if (
      Math.abs(point.x - (bounds.x + bounds.width)) < tolerance &&
      Math.abs(point.y - (bounds.y + bounds.height / 2)) < tolerance
    )
      return "e";

    return null;
  };

  // Save state to history
  const saveToHistory = () => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([...drawings]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // Get coordinates from mouse/touch event
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const screenPoint = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    return screenToWorld(screenPoint.x, screenPoint.y);
  };

  // Handle mouse/touch down
  const handleStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const point = getCoordinates(e);
    if (!point) return;

    if (currentTool === "hand") {
      setIsPanning(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      lastPanPointRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
      return;
    }

    if (currentTool === "pointer") {
      // Check if clicking on resize handle
      if (selectedDrawingId) {
        const handle = getResizeHandle(point, selectedDrawingId);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          startPointRef.current = point;
          return;
        }
      }

      // Check if clicking on a drawing
      let clickedDrawing: Drawing | null = null;
      for (let i = drawings.length - 1; i >= 0; i--) {
        if (isPointInDrawing(point, drawings[i])) {
          clickedDrawing = drawings[i];
          break;
        }
      }

      if (clickedDrawing) {
        setSelectedDrawingId(clickedDrawing.id);
        setIsDragging(true);
        // Calculate offset for smooth dragging
        const drawing = clickedDrawing;
        let centerX = 0,
          centerY = 0;
        if (drawing.tool === "pen" && drawing.points.length > 0) {
          const xs = drawing.points.map((p) => p.x);
          const ys = drawing.points.map((p) => p.y);
          centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
          centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
        } else if (drawing.startPoint && drawing.endPoint) {
          centerX = (drawing.startPoint.x + drawing.endPoint.x) / 2;
          centerY = (drawing.startPoint.y + drawing.endPoint.y) / 2;
        }
        dragOffsetRef.current = {
          x: point.x - centerX,
          y: point.y - centerY,
        };
        startPointRef.current = point;
        return;
      } else {
        setSelectedDrawingId(null);
      }
      return;
    }

    // Drawing tools
    setIsDrawing(true);
    startPointRef.current = point;

    const newDrawing: Drawing = {
      id: generateId(),
      tool: currentTool,
      color: currentColor,
      strokeWidth,
      points: currentTool === "pen" ? [point] : [],
      startPoint: currentTool !== "pen" ? point : undefined,
      endPoint: currentTool !== "pen" ? point : undefined,
    };

    setDrawings([...drawings, newDrawing]);
    saveToHistory();
  };

  // Handle mouse/touch move
  const handleMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning && lastPanPointRef.current) {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const currentPoint = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };

      setViewport((prev) => ({
        ...prev,
        offsetX: prev.offsetX + (currentPoint.x - lastPanPointRef.current!.x),
        offsetY: prev.offsetY + (currentPoint.y - lastPanPointRef.current!.y),
      }));

      lastPanPointRef.current = currentPoint;
      redrawCanvas();
      return;
    }

    if (isResizing && selectedDrawingId && startPointRef.current) {
      const point = getCoordinates(e);
      if (!point) return;

      setDrawings((prev) => {
        const newDrawings = prev.map((drawing) => {
          if (
            drawing.id !== selectedDrawingId ||
            !drawing.startPoint ||
            !drawing.endPoint
          )
            return drawing;

          const newDrawing = { ...drawing };
          const handle = resizeHandle;

          if (drawing.tool === "circle") {
            // For circle, adjust radius
            const dx = point.x - drawing.startPoint.x;
            const dy = point.y - drawing.startPoint.y;
            newDrawing.endPoint = {
              x: drawing.startPoint.x + dx,
              y: drawing.startPoint.y + dy,
            };
          } else {
            // For rectangle, line, arrow - adjust corners
            const startX = drawing.startPoint.x;
            const startY = drawing.startPoint.y;
            const endX = drawing.endPoint.x;
            const endY = drawing.endPoint.y;

            switch (handle) {
              case "nw":
                newDrawing.startPoint = point;
                newDrawing.endPoint = { x: endX, y: endY };
                break;
              case "ne":
                newDrawing.startPoint = { x: startX, y: point.y };
                newDrawing.endPoint = { x: point.x, y: endY };
                break;
              case "sw":
                newDrawing.startPoint = { x: point.x, y: startY };
                newDrawing.endPoint = { x: endX, y: point.y };
                break;
              case "se":
                newDrawing.endPoint = point;
                break;
              case "n":
                newDrawing.startPoint = { x: startX, y: point.y };
                break;
              case "s":
                newDrawing.endPoint = { x: endX, y: point.y };
                break;
              case "w":
                newDrawing.startPoint = { x: point.x, y: startY };
                break;
              case "e":
                newDrawing.endPoint = { x: point.x, y: endY };
                break;
            }
          }

          return newDrawing;
        });

        return newDrawings;
      });

      redrawCanvas();
      return;
    }

    if (
      isDragging &&
      selectedDrawingId &&
      dragOffsetRef.current &&
      startPointRef.current
    ) {
      const point = getCoordinates(e);
      if (!point) return;

      const deltaX = point.x - startPointRef.current.x;
      const deltaY = point.y - startPointRef.current.y;

      setDrawings((prev) => {
        return prev.map((drawing) => {
          if (drawing.id !== selectedDrawingId) return drawing;

          const newDrawing = { ...drawing };

          if (drawing.tool === "pen") {
            newDrawing.points = drawing.points.map((p) => ({
              x: p.x + deltaX,
              y: p.y + deltaY,
            }));
          } else if (drawing.startPoint && drawing.endPoint) {
            newDrawing.startPoint = {
              x: drawing.startPoint.x + deltaX,
              y: drawing.startPoint.y + deltaY,
            };
            newDrawing.endPoint = {
              x: drawing.endPoint.x + deltaX,
              y: drawing.endPoint.y + deltaY,
            };
          }

          return newDrawing;
        });
      });

      startPointRef.current = point;
      redrawCanvas();
      return;
    }

    if (isDrawing) {
      const point = getCoordinates(e);
      if (!point) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setDrawings((prev) => {
        const newDrawings = [...prev];
        const lastDrawing = newDrawings[newDrawings.length - 1];

        if (currentTool === "pen") {
          lastDrawing.points.push(point);
        } else {
          lastDrawing.endPoint = point;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(viewport.offsetX, viewport.offsetY);
        ctx.scale(viewport.zoom, viewport.zoom);
        newDrawings.slice(0, -1).forEach((d) => drawShape(ctx, d));
        drawShape(ctx, lastDrawing);
        if (selectedDrawingId && selectedDrawingId !== lastDrawing.id) {
          drawSelection(ctx, selectedDrawingId);
        }
        ctx.restore();

        return newDrawings;
      });
    }
  };

  // Handle mouse/touch up
  const handleEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      redrawCanvas();
    }
    if (isPanning) {
      setIsPanning(false);
      lastPanPointRef.current = null;
    }
    if (isDragging) {
      setIsDragging(false);
      dragOffsetRef.current = null;
      startPointRef.current = null;
      saveToHistory();
    }
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      startPointRef.current = null;
      saveToHistory();
    }
  };

  // Handle zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * zoomFactor));

    // Zoom towards mouse position
    const worldX = (mouseX - viewport.offsetX) / viewport.zoom;
    const worldY = (mouseY - viewport.offsetY) / viewport.zoom;

    setViewport({
      offsetX: mouseX - worldX * newZoom,
      offsetY: mouseY - worldY * newZoom,
      zoom: newZoom,
    });

    setTimeout(() => redrawCanvas(), 0);
  };

  // Undo
  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setDrawings([...history[newStep]]);
      setSelectedDrawingId(null);
      redrawCanvas();
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setDrawings([...history[newStep]]);
      redrawCanvas();
    }
  };

  // Clear canvas
  const handleClear = () => {
    saveToHistory();
    setDrawings([]);
    setSelectedDrawingId(null);
    redrawCanvas();
  };

  // Update canvas when drawings or viewport change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <div className="text-sm text-muted-foreground font-bold">
              Excalidraw Demo
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Zoom: {Math.round(viewport.zoom * 100)}%
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Toolbar */}
        <div className="w-64 border-r bg-muted/30 p-4 space-y-6 overflow-y-auto">
          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={currentTool === "pointer" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("pointer")}
                className="h-12"
              >
                <MousePointer2 className="h-4 w-4 mr-2" />
                Select
              </Button>
              <Button
                variant={currentTool === "hand" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("hand")}
                className="h-12"
              >
                <Hand className="h-4 w-4 mr-2" />
                Hand
              </Button>
              <Button
                variant={currentTool === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("pen")}
                className="h-12"
              >
                <Pen className="h-4 w-4 mr-2" />
                Pen
              </Button>
              <Button
                variant={currentTool === "arrow" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("arrow")}
                className="h-12"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Arrow
              </Button>
              <Button
                variant={currentTool === "rectangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("rectangle")}
                className="h-12"
              >
                <Square className="h-4 w-4 mr-2" />
                Rect
              </Button>
              <Button
                variant={currentTool === "circle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("circle")}
                className="h-12"
              >
                <Circle className="h-4 w-4 mr-2" />
                Circle
              </Button>
              <Button
                variant={currentTool === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("line")}
                className="h-12"
              >
                <Minus className="h-4 w-4 mr-2" />
                Line
              </Button>
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Colors</h3>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-10 h-10 rounded border-2 transition-all ${
                    currentColor === color
                      ? "border-foreground scale-110"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="mt-2 w-full h-10 rounded border cursor-pointer"
            />
          </div>

          {/* Stroke Width */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              Stroke Width: {strokeWidth}px
            </h3>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold mb-3">Actions</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyStep <= 0}
                className="flex-1"
              >
                <Undo className="h-4 w-4 mr-2" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyStep >= history.length - 1}
                className="flex-1"
              >
                <Redo className="h-4 w-4 mr-2" />
                Redo
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onWheel={handleWheel}
            className={`border border-border rounded-lg shadow-lg bg-white dark:bg-gray-800 touch-none ${
              currentTool === "hand"
                ? "cursor-grab active:cursor-grabbing"
                : "cursor-crosshair"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
