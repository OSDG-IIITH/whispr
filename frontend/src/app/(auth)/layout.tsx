import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Authentication | Whispr",
  description: "The Review Portal for IIIT Hyderabad",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Left side with background image */}
      <div 
        className="hidden h-full w-full md:block lg:col-span-1 relative overflow-hidden"
        style={{
          backgroundImage: "url('https://picsum.photos/1000/1600')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Improved overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        {/* Content with improved text visibility */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          <Link className="flex items-center gap-2" href="/">
            <Image 
              src="/logo.png" 
              alt="Whispr" 
              width={40} 
              height={40} 
              className="h-10 w-10" 
            />
            <span className="text-xl font-bold text-white drop-shadow-md">Whispr</span>
          </Link>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">The Review Portal for IIIT Hyderabad</h1>
            <p className="text-white drop-shadow-sm font-medium">
              Join the community to share and explore course reviews, faculty feedback, and more.
            </p>
          </div>
          
          <div className="text-sm text-white/90 drop-shadow-sm font-medium">
            &copy; {new Date().getFullYear()} Whispr. All rights reserved.
          </div>
        </div>
      </div>
      
      {/* Right side - Auth content */}
      <div className="flex items-center justify-center p-8 md:p-12 lg:col-span-2">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-2 md:hidden">
            <Image 
              src="/logo.png" 
              alt="Whispr" 
              width={40} 
              height={40} 
              className="h-10 w-10" 
            />
            <h1 className="text-2xl font-bold">Whispr</h1>
            <p className="text-center text-muted-foreground">
              The Review Portal for IIIT Hyderabad
            </p>
          </div>
          <div className="absolute top-4 right-4">
            <ModeToggle />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}