// Shared types for the ASCII zoo renderers.

export interface ZooAudio {
  bass: number   // smoothed 0..1
  drums: number  // smoothed 0..1
  kick: number   // peak/decay envelope
  main: number   // smoothed 0..1
  vox: number    // smoothed 0..1
  playing: boolean
}

export interface RenderCtx {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number    // CSS pixels
  height: number   // CSS pixels
  cellW: number
  cellH: number
  fontSize: number
  cols: number
  rows: number
  audio: ZooAudio
  frame: number
  /** Optional source image, populated once loaded if `src` is set on Renderer. */
  img: HTMLImageElement | null
}

export interface Renderer {
  /** Optional image source to pre-load into RenderCtx.img. */
  src?: string
  /** Called whenever canvas dimensions change (and after image load). */
  onResize?: (ctx: RenderCtx) => void
  /** Called every frame (throttled to the panel's cadence). */
  onFrame: (ctx: RenderCtx) => void
}
