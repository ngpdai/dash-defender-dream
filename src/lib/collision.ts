/**
 * Collision System - Single Source of Truth
 * 
 * ARCHITECTURE:
 * - All entities use a unified Transform interface
 * - Positions are in PERCENTAGE (0-100%) of game area
 * - Sizes are also in PERCENTAGE for consistency
 * - Anchor is CENTER-CENTER for all entities (0.5, 0.5)
 * - Colliders are BoxCollider (AABB) only
 * 
 * SIZING RULES:
 * - Collider = 85% of visual sprite size (forgiving but fair)
 * - No transparent padding included
 * - Explicitly defined for each entity type
 */

// Game area reference dimensions (used for calculations)
export const GAME_AREA = {
  width: 400,  // Reference width in pixels
  height: 600, // Reference height in pixels
};

// Entity type definitions
export type EntityType = 'speeder' | 'tank' | 'asteroid' | 'debris' | 'mine' | 'ufo';

/**
 * Transform - The SINGLE SOURCE OF TRUTH for entity positioning
 * Both rendering and collision use this same data structure
 */
export interface Transform {
  x: number;      // Center X position (0-100%)
  y: number;      // Center Y position (0-100%)
  width: number;  // Width in percentage of game area
  height: number; // Height in percentage of game area
}

/**
 * BoxCollider - AABB collision bounds derived from Transform
 * Uses same coordinate system as rendering
 */
export interface BoxCollider {
  left: number;   // Left edge (x - width/2)
  right: number;  // Right edge (x + width/2)
  top: number;    // Top edge (y - height/2)
  bottom: number; // Bottom edge (y + height/2)
}

/**
 * Entity size definitions in PIXELS (measured from actual sprites)
 * These are the VISUAL sizes of sprites
 * 
 * SPRITE MEASUREMENTS (from GameVisuals.tsx):
 * - Speeder: w-10 h-14 → 40x56px (base), md:w-12 md:h-16 → 48x64px (desktop)
 * - Titan: w-12 h-14 → 48x56px (base), md:w-14 md:h-16 → 56x64px (desktop)
 * - Asteroid: w-10 h-10 → 40x40px
 * - Debris: w-8 h-8 → 32x32px
 * - Mine: w-8 h-8 → 32x32px
 * - UFO: w-12 h-12 → 48x48px
 * 
 * Using BASE sizes (mobile) for consistent collision across devices
 */
const VISUAL_SIZES_PX: Record<EntityType, { width: number; height: number }> = {
  speeder: { width: 40, height: 56 },
  tank: { width: 48, height: 56 },
  asteroid: { width: 40, height: 40 },
  debris: { width: 32, height: 32 },
  mine: { width: 32, height: 32 },
  ufo: { width: 48, height: 48 },
};

/**
 * Collider scale factors per entity category
 * Base: 48% of visual size
 * Ships & Obstacles: additional 20% reduction = 38%
 */
const COLLIDER_SCALES: Record<EntityType, number> = {
  speeder: 0.38,   // Ship: 48% * 0.80 = 38%
  tank: 0.38,      // Ship: 48% * 0.80 = 38%
  asteroid: 0.38,  // Obstacle: 48% * 0.80 = 38%
  debris: 0.38,    // Obstacle: 48% * 0.80 = 38%
  mine: 0.38,      // Obstacle: 48% * 0.80 = 38%
  ufo: 0.48,       // UFO: keep at 48%
};

/**
 * Hitbox offset for obstacles (to align with visual center)
 * Positive X = shift right, Positive Y = shift down
 * Values are in percentage of game area
 */
const HITBOX_OFFSET: Record<EntityType, { x: number; y: number }> = {
  speeder: { x: 0, y: 0 },
  tank: { x: 0, y: 0 },
  asteroid: { x: 2, y: 0 },   // Shift 2% to the right
  debris: { x: 2, y: 0 },     // Shift 2% to the right
  mine: { x: 2, y: 0 },       // Shift 2% to the right
  ufo: { x: 0, y: 0 },
};

/**
 * Convert pixel size to percentage of game area
 */
export function pixelToPercent(pixels: number, dimension: 'width' | 'height'): number {
  const reference = dimension === 'width' ? GAME_AREA.width : GAME_AREA.height;
  return (pixels / reference) * 100;
}

/**
 * Get the collider size for an entity type (in percentage)
 * Collider is COLLIDER_SCALE (85%) of visual size for fairness
 */
export function getColliderSize(entityType: EntityType): { width: number; height: number } {
  const visual = VISUAL_SIZES_PX[entityType];
  const scale = COLLIDER_SCALES[entityType];
  
  // Apply entity-specific collider scale
  const colliderWidth = visual.width * scale;
  const colliderHeight = visual.height * scale;
  
  // Convert to percentage of game area
  return {
    width: pixelToPercent(colliderWidth, 'width'),
    height: pixelToPercent(colliderHeight, 'height'),
  };
}

/**
 * Get the visual size for an entity type (in percentage)
 * Used for rendering hitbox debug overlays
 */
export function getVisualSize(entityType: EntityType): { width: number; height: number } {
  const visual = VISUAL_SIZES_PX[entityType];
  return {
    width: pixelToPercent(visual.width, 'width'),
    height: pixelToPercent(visual.height, 'height'),
  };
}

/**
 * Create a Transform from position and entity type
 * This is the SINGLE SOURCE OF TRUTH - both rendering and collision use this
 * Applies hitbox offset for alignment with visual sprites
 */
export function createTransform(x: number, y: number, entityType: EntityType): Transform {
  const size = getColliderSize(entityType);
  const offset = HITBOX_OFFSET[entityType];
  
  return {
    x: x + offset.x,  // Apply horizontal offset
    y: y + offset.y,  // Apply vertical offset
    width: size.width,
    height: size.height,
  };
}

/**
 * Derive BoxCollider bounds from Transform
 * Uses CENTER-CENTER anchor (standard for all entities)
 */
export function getColliderBounds(transform: Transform): BoxCollider {
  const halfWidth = transform.width / 2;
  const halfHeight = transform.height / 2;
  
  return {
    left: transform.x - halfWidth,
    right: transform.x + halfWidth,
    top: transform.y - halfHeight,
    bottom: transform.y + halfHeight,
  };
}

/**
 * AABB Collision Detection (Axis-Aligned Bounding Box)
 * Uses same coordinate system as rendering (percentages)
 * 
 * Two boxes collide if they overlap on BOTH axes
 */
export function checkAABBCollision(a: BoxCollider, b: BoxCollider): boolean {
  // Check for separation on either axis
  // If separated on any axis, no collision
  const separatedX = a.right < b.left || a.left > b.right;
  const separatedY = a.bottom < b.top || a.top > b.bottom;
  
  // Collision occurs when NOT separated on both axes
  return !separatedX && !separatedY;
}

/**
 * Check if two entities collide
 * Both must have valid transforms with same anchor system (CENTER-CENTER)
 */
export function checkEntityCollision(
  entityA: { x: number; y: number },
  typeA: EntityType,
  entityB: { x: number; y: number },
  typeB: EntityType
): boolean {
  // Create transforms from positions
  const transformA = createTransform(entityA.x, entityA.y, typeA);
  const transformB = createTransform(entityB.x, entityB.y, typeB);
  
  // Get collision bounds
  const boundsA = getColliderBounds(transformA);
  const boundsB = getColliderBounds(transformB);
  
  // Check AABB collision
  return checkAABBCollision(boundsA, boundsB);
}

/**
 * Lane positions for standardized obstacle spawning
 * 5 lanes evenly distributed across playable area (15% to 85%)
 */
export const LANES = {
  positions: [17, 32, 50, 68, 83] as const, // Fixed X positions for each lane
  count: 5,
  
  // Get a random lane position, optionally excluding some lanes
  getRandom(excludeLanes: number[] = []): number {
    const available = this.positions.filter(
      lane => !excludeLanes.some(excluded => Math.abs(excluded - lane) < 10)
    );
    
    if (available.length === 0) {
      return this.positions[Math.floor(Math.random() * this.count)];
    }
    
    return available[Math.floor(Math.random() * available.length)];
  },
  
  // Snap a position to the nearest lane
  snapToLane(x: number): number {
    let nearestLane = this.positions[0];
    let minDistance = Math.abs(x - nearestLane);
    
    for (const lane of this.positions) {
      const distance = Math.abs(x - lane);
      if (distance < minDistance) {
        minDistance = distance;
        nearestLane = lane;
      }
    }
    
    return nearestLane;
  },
};

/**
 * Debug info for collision visualization
 * Returns all data needed to render hitbox overlays
 */
export interface CollisionDebugInfo {
  // Visual sprite bounds (what player sees)
  visual: {
    x: number;
    y: number;
    width: number;  // Percentage
    height: number; // Percentage
    widthPx: number;  // Pixels (for overlay sizing)
    heightPx: number; // Pixels (for overlay sizing)
  };
  // Collision bounds (what game uses for collision)
  collider: BoxCollider;
  // Center point (should match for both)
  center: { x: number; y: number };
}

/**
 * Get debug visualization data for an entity
 */
export function getDebugInfo(x: number, y: number, entityType: EntityType): CollisionDebugInfo {
  const visualSize = getVisualSize(entityType);
  const visualPx = VISUAL_SIZES_PX[entityType];
  const transform = createTransform(x, y, entityType);
  const collider = getColliderBounds(transform);
  
  return {
    visual: {
      x,
      y,
      width: visualSize.width,
      height: visualSize.height,
      widthPx: visualPx.width,
      heightPx: visualPx.height,
    },
    collider,
    center: { x, y },
  };
}

/**
 * Export collider scale for external reference
 */
export const COLLISION_CONFIG = {
  colliderScales: COLLIDER_SCALES,
  gameArea: GAME_AREA,
  visualSizes: VISUAL_SIZES_PX,
};
