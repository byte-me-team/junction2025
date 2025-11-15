import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export function ProfileButton() {
  return (
    <Button
      asChild
      size="sm"
      variant="ghost"
      className="p-2 hover:bg-primary/10"
    >
      <Link href="/profile" className="flex items-center">
        <User className="h-5 w-5 text-primary" strokeWidth={2} />
      </Link>
    </Button>
  );
}
