import { Link, useLocation } from "wouter";
import { Search, Plus, Menu, Moon, Sun, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";
import { useWallet } from "@/lib/walletContext";
import { truncateAddress } from "@/lib/web3Config";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { address, isConnected, isCorrectNetwork, axmBalance, connect, disconnect, switchNetwork, isConnecting } = useWallet();
  const [, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <span className="font-bold text-primary-foreground text-lg">L</span>
              <div className="absolute inset-0 rounded-lg bg-primary/20 blur-sm -z-10" />
            </div>
            <span className="hidden sm:block font-semibold text-lg tracking-tight">
              Lumina
            </span>
          </Link>
        </div>

        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search creators, posts, groups..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-primary"
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCorrectNetwork && isConnected && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 border-destructive text-destructive hover:bg-destructive/10"
              onClick={switchNetwork}
              data-testid="button-switch-network"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden lg:inline">Switch to Arbitrum</span>
            </Button>
          )}

          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 font-mono text-xs border-primary/30 bg-primary/5"
                  data-testid="button-wallet-connected"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">{truncateAddress(address!)}</span>
                  <Badge variant="secondary" className="hidden lg:flex font-mono text-xs">
                    {axmBalance} AXM
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="font-mono text-xs">
                  {address}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-between">
                  <span>AXM Balance</span>
                  <span className="font-mono">{axmBalance}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnect} data-testid="button-disconnect-wallet">
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30"
              onClick={connect}
              disabled={isConnecting}
              data-testid="button-connect-wallet"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">{isConnecting ? "Connecting..." : "Connect"}</span>
            </Button>
          )}

          {user && (
            <>
              <Button
                variant="default"
                size="sm"
                className="gap-2 shadow-lg shadow-primary/25"
                onClick={() => navigate("/compose")}
                data-testid="button-create-post"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </Button>

              <NotificationBell />
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-profile-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {(user.displayName || user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.displayName || user.username}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)} data-testid="menu-profile">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} data-testid="menu-settings">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive" data-testid="menu-logout">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate("/login")} data-testid="button-login">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
