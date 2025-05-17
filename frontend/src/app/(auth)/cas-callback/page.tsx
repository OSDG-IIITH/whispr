"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CASCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Extract ticket from URL if present
    const ticket = searchParams.get('ticket');
    
    if (!ticket) {
      setError("No CAS ticket found in the URL");
      return;
    }
    
    async function validateTicket() {
      try {
        // Here you would validate the ticket with your backend API
        // const response = await fetch('/api/auth/validate-cas-ticket', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ ticket })
        // });
        // const data = await response.json();
        
        // For now, we'll simulate a successful verification
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Store authentication token or user info in localStorage/cookies
        localStorage.setItem('authToken', 'sample-auth-token');
        
        // Redirect to dashboard after successful authentication
        router.push('/dashboard');
      } catch (err) {
        console.error("Error validating CAS ticket:", err);
        setError("Failed to verify your identity. Please try again.");
      }
    }
    
    validateTicket();
  }, [searchParams, router]);
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {error ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-destructive">Authentication Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
          >
            Return to login
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <h2 className="text-xl font-bold">Verifying your identity</h2>
          <p className="text-muted-foreground">
            Please wait while we validate your credentials...
          </p>
        </div>
      )}
    </div>
  );
}
