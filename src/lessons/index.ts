import type { ComponentType } from "react";
import Introduction from "./introduction";
import Selections from "./selections";
import DataJoin from "./data-join";
import Events from "./events";
import ContinuousScales from "./continuous-scales";
import OrdinalScales from "./ordinal-scales";
import Axes from "./axes";
import LinesAreas from "./lines-areas";
import ArcsPies from "./arcs-pies";
import StacksSymbols from "./stacks-symbols";
import Arrays from "./arrays";
import Formatting from "./formatting";
import Fetching from "./fetching";
import Random from "./random";
import Color from "./color";
import Transitions from "./transitions";
import Timers from "./timers";
import Zoom from "./zoom";
import Drag from "./drag";
import Brush from "./brush";
import Hierarchy from "./hierarchy";
import Force from "./force";
import Chord from "./chord";
import Geo from "./geo";
import Delaunay from "./delaunay";
import Quadtree from "./quadtree";
import Contours from "./contours";
import React from "./react";
import Capstone from "./capstone";

export const lessonComponents: Record<string, ComponentType> = {
  "introduction": Introduction,
  "selections": Selections,
  "data-join": DataJoin,
  "events": Events,
  "continuous-scales": ContinuousScales,
  "ordinal-scales": OrdinalScales,
  "axes": Axes,
  "lines-areas": LinesAreas,
  "arcs-pies": ArcsPies,
  "stacks-symbols": StacksSymbols,
  "arrays": Arrays,
  "formatting": Formatting,
  "fetching": Fetching,
  "random": Random,
  "color": Color,
  "transitions": Transitions,
  "timers": Timers,
  "zoom": Zoom,
  "drag": Drag,
  "brush": Brush,
  "hierarchy": Hierarchy,
  "force": Force,
  "chord": Chord,
  "geo": Geo,
  "delaunay": Delaunay,
  "quadtree": Quadtree,
  "contours": Contours,
  "react": React,
  "capstone": Capstone,
};
