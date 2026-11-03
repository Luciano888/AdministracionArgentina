import { EventIcon } from "@/components/EventIcon";

export function EventCover({
  gradient,
  icon,
  imagen,
  className = "",
  iconClassName = "size-8 text-white",
}: {
  gradient: string;
  icon?: string;
  imagen?: string;
  className?: string;
  iconClassName?: string;
}) {
  if (imagen) {
    return <img src={imagen} alt="" className={`object-cover ${className}`} />;
  }
  return (
    <div className={`flex items-end bg-gradient-to-br ${gradient} ${className}`}>
      <EventIcon icon={icon} className={iconClassName} />
    </div>
  );
}
