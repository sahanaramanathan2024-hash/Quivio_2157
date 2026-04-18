import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { LayoutDashboard, BookOpen, PenTool, History, LogOut, Menu, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Quizzes", href: "/quizzes", icon: BookOpen },
    { name: "Create Quiz", href: "/quizzes/create", icon: PenTool },
    { name: "My Attempts", href: "/attempts", icon: History },
  ];

  const handleSignOut = () => {
    signOut(() => setLocation("/"));
  };

  const NavLinks = ({ onClickItem }: { onClickItem?: () => void }) => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link key={item.name} href={item.href}>
            <span
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={onClickItem}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "linear-gradient(135deg, #fff8f0 0%, #fdf4ff 50%, #f0faf9 100%)" }}>
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-gray-100 bg-white/90 px-4 md:px-8 backdrop-blur shadow-sm">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col bg-white">
            <div className="flex h-14 items-center gap-2.5 border-b px-4">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold uppercase tracking-wide text-foreground">QUIVIO</span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              <NavLinks onClickItem={() => setIsMobileMenuOpen(false)} />
            </nav>
            <div className="p-4 border-t">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <span className="hidden md:flex items-center gap-2 cursor-pointer">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="font-extrabold uppercase tracking-wide text-foreground text-lg">QUIVIO</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLinks />
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/quizzes/create">
              <Button
                size="sm"
                className="hidden md:flex gap-2 font-semibold rounded-xl"
                style={{ background: "linear-gradient(135deg, #f97316, #fb923c)", color: "white", border: "none" }}
              >
                <PlusCircle className="h-4 w-4" />
                New Quiz
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium hidden sm:inline-block text-muted-foreground">
                {user?.firstName || user?.primaryEmailAddress?.emailAddress}
              </span>
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                <AvatarFallback className="bg-primary text-white text-xs font-bold">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
