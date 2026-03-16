import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function isImageUrl(avatar: string): boolean {
  return (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:")
  );
}

function getInitials(name: string, avatar: string): string {
  if (avatar && !isImageUrl(avatar)) return avatar;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] ?? "") + (parts[1][0] ?? "");
  }
  return name.slice(0, 2).toUpperCase() || "??";
}

interface RepAvatarProps {
  avatar: string;
  name: string;
  className?: string;
}

const RepAvatar = ({ avatar, name, className }: RepAvatarProps) => {
  const initials = getInitials(name, avatar);
  const useImage = avatar && isImageUrl(avatar);

  if (useImage) {
    return (
      <Avatar className={cn("shrink-0", className)}>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg text-xs font-bold bg-secondary text-foreground",
        className,
      )}
    >
      {initials}
    </div>
  );
};

export default RepAvatar;
