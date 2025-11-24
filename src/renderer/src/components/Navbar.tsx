import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Theme Toggle on far left */}
        <div className="mr-4 flex">
          <ThemeToggle />
        </div>

        {/* Logo/Brand */}
        <div className="mr-4 flex items-center space-x-2">
          <span className="font-semibold text-lg">Electron App</span>
        </div>

        {/* Navigation Items (center) */}
        <div className="flex flex-1 items-center justify-center space-x-6 text-sm font-medium">
          <a
            href="#"
            className="transition-colors hover:text-foreground/80 text-foreground"
          >
            Home
          </a>
          <a
            href="#"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Features
          </a>
          <a
            href="#"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Settings
          </a>
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">v1.0.0</span>
        </div>
      </div>
    </nav>
  );
}

