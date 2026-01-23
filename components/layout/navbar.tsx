import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  return (
    <header className="w-full border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        
        {/* Left */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-lg font-semibold">
            BuildDock
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Builds
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              About
            </Link>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Button variant="ghost">Login</Button>
          <Button>Get Started</Button>
        </div>
      </div>
    </header>
  )
}
