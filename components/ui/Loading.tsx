"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Loading({ 
  message = "Carregando...", 
  fullScreen = false,
  size = "md"
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={`${sizeClasses[size]} text-primary`} />
      </motion.div>
      {message && (
        <p className="text-sm text-foreground/70 animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{content}</div>;
}

