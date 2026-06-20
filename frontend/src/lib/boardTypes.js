import {
  LayoutGrid,
  Code2,
  Megaphone,
  Settings2,
  Briefcase,
  Users,
  Palette,
} from "lucide-react";

export const BOARD_TYPES = [
  { value: "general",    label: "General",        icon: LayoutGrid },
  { value: "software",   label: "Software",       icon: Code2 },
  { value: "marketing",  label: "Marketing",      icon: Megaphone },
  { value: "operations", label: "Operations",     icon: Settings2 },
  { value: "client",     label: "Client Project", icon: Briefcase },
  { value: "hr",         label: "HR & People",    icon: Users },
  { value: "design",     label: "Design",         icon: Palette },
];

const _iconMap = Object.fromEntries(BOARD_TYPES.map((t) => [t.value, t.icon]));

/** Returns the Lucide icon component for a given board_type string. Falls back to LayoutGrid. */
export function getBoardIcon(board_type) {
  return _iconMap[board_type] ?? LayoutGrid;
}
