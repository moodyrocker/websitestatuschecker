import React from "react";
import { Moon, Sun, Globe, Github, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface HeaderProps {
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
}

const Header = ({
  isDarkMode = false,
  onThemeToggle = () => {},
}: HeaderProps) => {
  return (
    <header className="w-full h-20 px-6 bg-background border-b border-border flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-background/95">
      <div className="flex items-center">
        <Globe className="h-7 w-7 text-primary mr-3" />
        <h1 className="text-2xl font-bold text-foreground">
          Website Status Checker
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Info className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Check website availability and performance</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Github className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>View source code on GitHub</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-2 ml-2 border-l pl-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Sun
                  className={`h-5 w-5 ${isDarkMode ? "text-muted-foreground" : "text-yellow-500"}`}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Switch
            checked={isDarkMode}
            onCheckedChange={onThemeToggle}
            aria-label="Toggle dark mode"
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Moon
                  className={`h-5 w-5 ${isDarkMode ? "text-blue-400" : "text-muted-foreground"}`}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
};

export default Header;
