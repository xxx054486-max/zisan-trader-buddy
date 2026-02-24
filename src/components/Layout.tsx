import { ReactNode, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, PenSquare, Map, FolderOpen, LogIn, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIPAddress } from "@/hooks/useIPAddress";
import { toast } from "sonner";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/report", icon: PenSquare, label: "Report" },
  { path: "/map", icon: Map, label: "Map" },
  { path: "/my-reports", icon: FolderOpen, label: "My Reports" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { ip, loading: ipLoading } = useIPAddress();
  const [ipExpanded, setIpExpanded] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationInfo, setLocationInfo] = useState("");
  const expandRef = useRef<HTMLDivElement>(null);

  const isTabPage = tabs.some((t) => t.path === location.pathname);

  // Request location permission on load and reverse geocode
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=bn`)
          .then((r) => r.json())
          .then((data) => {
            if (data.display_name) setLocationInfo(data.display_name);
          })
          .catch(() => {});
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (expandRef.current && !expandRef.current.contains(e.target as Node)) {
        setIpExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    if (confirm("আপনি কি লগআউট করতে চান?")) {
      signOut();
      toast.success("লগআউট সফল");
    }
  };

  if (!isTabPage) {
    return <div className="fixed inset-0 flex flex-col bg-background">{children}</div>;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 h-14 bg-topbar text-topbar-foreground shrink-0 z-50 relative">
        <h1 className="text-lg font-bold tracking-tight">Corruption Alert</h1>
        <div className="flex items-center gap-2">
          {/* IP Badge */}
          <div ref={expandRef} className="relative">
            <button
              onClick={() => setIpExpanded(!ipExpanded)}
              className="flex items-center gap-1 bg-white/15 border border-white/25 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white transition-all active:bg-white/25"
            >
              {ipLoading ? "..." : ip || "Unknown"}
              <ChevronDown size={10} className={`transition-transform ${ipExpanded ? "rotate-180" : ""}`} />
            </button>
            {ipExpanded && (
              <div className="absolute top-10 right-0 bg-card text-foreground rounded-xl p-3 shadow-lg z-[999] min-w-[220px] border border-border space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  IP: <span className="font-semibold text-foreground">{ip || "Unknown"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  লোকেশন: <span className="font-semibold text-foreground">{locationInfo || "Unknown"}</span>
                </p>
                {userCoords && (
                  <p className="text-xs text-muted-foreground">
                    Lat/Lng: <span className="font-semibold text-foreground">{userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {user ? (
            <button onClick={handleLogout} className="p-1.5 rounded-full bg-topbar-foreground/15">
              <LogOut size={14} />
            </button>
          ) : (
            <button onClick={() => navigate("/login")} className="p-1.5 rounded-full bg-topbar-foreground/15">
              <LogIn size={14} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>

      <nav className="flex items-center justify-around h-16 bg-card border-t border-border shrink-0 z-50">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative ${
                active ? "text-primary scale-105" : "text-muted-foreground"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-[20%] right-[20%] h-0.5 bg-primary rounded-b" />
              )}
              <tab.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
