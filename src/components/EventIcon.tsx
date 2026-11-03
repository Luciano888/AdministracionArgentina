import { Clapperboard, Landmark, Microscope, Music, Palette, Ship, Theater, Users, type LucideIcon } from "lucide-react";
import type { EventIconName } from "@/types";

const MAP: Record<EventIconName, LucideIcon> = {
  theater: Theater,
  music: Music,
  palette: Palette,
  film: Clapperboard,
  landmark: Landmark,
  ship: Ship,
  users: Users,
  microscope: Microscope,
};

export function EventIcon({ icon, className }: { icon?: string; className?: string }) {
  const Icon = MAP[(icon as EventIconName) ?? "theater"] ?? Theater;
  return <Icon className={className} aria-hidden />;
}
