"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle CAS authentication redirect
  async function handleCASAuth() {
    setIsLoading(true);
    try {
      const casLoginUrl = "https://login.iiit.ac.in/cas/login";
      
      // You would typically add service parameter for the callback URL
      const serviceUrl = `${window.location.origin}/auth/cas-callback`;
      const redirectUrl = `${casLoginUrl}?service=${encodeURIComponent(serviceUrl)}`;
      
      // Redirect to CAS
      window.location.href = redirectUrl;
      
      // Note: The following code won't execute due to the redirect
      console.log("Redirecting to CAS...");
    } catch (error) {
      console.error("CAS redirection error:", error);
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Register using your LDAP credentials to access Whispr.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            Authentication through CAS ensures that only 
            IIITH can access Whispr.
          </p>
        </div>
        
        <Button 
          onClick={handleCASAuth}
          className="w-full cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting to CAS...
            </>
          ) : (
            <>
              Sign up with IIIT CAS
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Information</span>
          </div>
        </div>
        
        <div className="rounded-md bg-muted/50 p-4">
          <h3 className="mb-2 font-medium">Is this safe?</h3>
          <p className="text-sm text-muted-foreground">
            CAS Verification is only to ensure that you are a student of IIITH. Your resultant account
            will not be linked to the email ID and you will be anonymous.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4 border-t pt-6">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}