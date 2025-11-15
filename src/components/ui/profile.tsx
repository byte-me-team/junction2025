import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export function ProfileButton() {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-11 w-11 rounded-full border border-primary/20 bg-background/90 text-primary shadow-sm shadow-primary/20 transition hover:border-primary/60 hover:-translate-y-0.5"
          aria-label="Profile options"
        >
          <User className="h-5 w-5" strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile">{user ? "Account" : "Profile"}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={user ? "/auth/sign-out" : "/auth/sign-in"}>
            {user ? "Sign out" : "Sign in"}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
