"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function performLogout() {
      try {
        // Here you would typically call your logout API endpoint
        // const response = await fetch('/api/auth/logout', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        //   }
        // });
        
        // For now, simulate API call with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear authentication data from local storage/cookies
        localStorage.removeItem('authToken');
        
        // Redirect to login page after logout
        router.push('/login');
      } catch (err) {
        console.error("Logout error:", err);
        setError("An error occurred during logout. Please try again.");
      }
    }
    
    performLogout();
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {error ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-destructive">Logout Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
          >
            Return to home page
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <h2 className="text-xl font-bold">Signing you out</h2>
          <p className="text-muted-foreground">
            Please wait while we securely log you out...
          </p>
        </div>
      )}
    </div>
  );
}
