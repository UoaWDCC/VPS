export type Component =
  | BoxComponent
  | TextBoxComponent
  | ImageComponent
  | EllipseComponent
  | SpeechComponent
  | LineComponent
  | AudioComponent;

export type Comparator = "=" | "!=" | "<" | ">";
export type PropertyOperationType = "set" | "add" | "subtract";

export interface Condition {
  id: string;
  stateVariableId: string;
  comparator: Comparator;
  value: unknown;
}

export interface Operation {
  id: string;
  stateVariableId: string;
  operation: PropertyOperationType;
  value: unknown;
}

export interface Action {
  id: string;
  name: string;
  linkedScene: string | null;
  conditions: Condition[];
  operations: Operation[];
}

export interface Scene {
  _id: string;
  name: string;
  components: Record<string, Component>;
  roles: string[];
  time: number | null;
  actions: Action[];
  defaultActionIds: string[];
  timerActionIds: string[];
  background: SceneBackground | null;
}

export type BackgroundFit = "cover" | "contain" | "fill";

export interface ImageBackground {
  kind: "image";
  fileId: string;
  href: string;
  fit: BackgroundFit;
}

export interface ColorBackground {
  kind: "color";
  color: string;
}

export type SceneBackground = ImageBackground | ColorBackground;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Bounds {
  verts: Vec2[];
  rotation: number;
}

export interface RelativeBounds {
  x: number;
  y: number;
  height: number;
  width: number;
  rotation: number;
}

export interface Guide {
  orientation: "vertical" | "horizontal";
  position: number;
  isCanvasCenter?: boolean;
}

interface GenericComponent {
  id: string;
  bounds: Bounds;
  zIndex: number;
  clickable?: boolean;
  stateBindings?: PropertyBinding[];
  actions?: string[];
}

export interface PropertyBinding {
  target: string;
  stateVariableId: string;
}

interface ShapeComponent extends GenericComponent {
  fill: HexString;
  stroke: HexString;
  strokeWidth: number;
}

export interface ImageComponent extends GenericComponent {
  type: "image";
  fileId: string;
  href: string;
  preserveAspectRatio: string;
}

export interface AudioComponent extends GenericComponent {
  type: "audio";
  fileId: string;
  url: string;
  name: string;
  loop: boolean;
}

export interface SpeechComponent extends ShapeComponent {
  type: "speech";
}

export interface BoxComponent extends ShapeComponent {
  type: "box";
}

export interface LineComponent extends GenericComponent {
  type: "line";
  stroke: HexString;
  strokeWidth: number;
}

export interface EllipseComponent extends ShapeComponent {
  type: "ellipse";
}

export interface TextBoxComponent extends ShapeComponent {
  type: "textbox";
  document: ModelDocument;
  color: HexString;
  padding: number;
}

interface BaseModelDocument {
  type: "text";
  blocks: ModelBlock[];
  style?: Partial<BaseTextStyle>;
}

export interface ModelDocument extends BaseModelDocument {
  bounds: RelativeBounds;
  id: string;
}

export interface ModelBlock {
  style?: Partial<BlockTextStyle>;
  spans: ModelSpan[];
}

export interface PropertyRef {
  id: string;
  displayName: string;
  missing?: boolean;
}

export interface ModelSpan {
  text: string;
  style?: Partial<SpanTextStyle>;
  property?: PropertyRef;
}

export interface BaseTextStyle extends BlockTextStyle, SpanTextStyle {}

export interface BlockTextStyle {
  alignment: "left" | "center" | "right";
  lineHeight: number;
}

export interface SpanTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: string;
  textColor: HexString;
  highlightColor: HexString;
}

type HexString = string;

export interface UploadedFile {
  _id: string;
  name: string;
  type: "image" | "audio" | "document";
  path: string;
  url: string;
  contentType: string;
  size: number;
  uploaderUid: string;
  scenarioId: string;
  refCount: number;
  deletedAt: Date | null;
}
