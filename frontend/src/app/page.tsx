"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Book, Users, Info, TrendingUp, MessageCircle, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/theme-toggle";
import { useSearchStore } from "@/store/searchStore";

export default function Home() {
	const searchQuery = useSearchStore((state) => state.searchQuery);
	const setSearchQuery = useSearchStore((state) => state.setSearchQuery);

	return (
		<main className="flex min-h-screen flex-col items-center p-6 md:p-12 gap-8 max-w-6xl mx-auto relative">
			{/* Decorative background elements */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -z-10 transform translate-x-1/3 -translate-y-1/4"></div>
			<div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-400/5 to-blue-400/5 rounded-full blur-3xl -z-10 transform -translate-x-1/3 translate-y-1/4"></div>
			
			<div className="fixed top-4 right-4 z-50">
				<ModeToggle />
			</div>

			<section className="text-center w-full mt-8 relative">
				{/* Small decorative dots */}
				<div className="hidden md:block absolute top-10 left-10 w-24 h-24 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-md"></div>
				<div className="hidden md:block absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-md"></div>
				
				<div className="relative inline-block">
					<div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-violet-600/20 rounded-full blur-xl -z-10 scale-150"></div>
					<h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-violet-500">
						<div className="inline-block">
							<div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full blur-md"></div>
							<Image
								src="/logo.png"
								alt="Whispr Logo"
								width={60}
								height={60}
								className="inline-block mr-3 relative"
							/>
						</div>
						Whispr
					</h1>
				</div>
				<h2 className="text-2xl md:text-3xl text-muted-foreground mb-10">
					The review portal for courses and professors
				</h2>

				{/* Search functionality */}
				<div className="max-w-2xl mx-auto relative z-10">
					<div className="absolute inset-x-0 top-1/2 h-10 bg-gradient-ocean opacity-5 blur-lg -z-10 rounded-full transform -translate-y-1/2"></div>
					<div
						className="relative flex items-center mb-8 group transition-all duration-300 focus:scale-105"
					>
						<Input
							type="text"
							placeholder="Search for courses or professors..."
							className="pr-12 h-12 text-lg shadow-sm focus:shadow-md focus:border-blue-400 transition-all rounded-lg border-opacity-60 backdrop-blur-sm"
							value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-2 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
						>
							<Search className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</section>

			{/* Feature Cards Section */}
			<section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 relative">
				{/* Card 1 - Courses */}
				<div className="transition-all hover:-translate-y-1 hover:shadow-lg duration-200">
					<div className="absolute inset-0 bg-blue-400/5 blur-xl rounded-xl -z-10 transform scale-95"></div>
					<Card className="h-full border border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
						<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/20 to-indigo-400/5 rounded-bl-[var(--radius)] transform translate-x-4 -translate-y-4"></div>
						<CardHeader className="pb-3 relative z-10">
							<CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
								<Book className="h-5 w-5" />
								Browse Courses
							</CardTitle>
							<CardDescription>
								Find reviews and ratings for all courses
							</CardDescription>
						</CardHeader>
						<CardContent className="relative z-10">
							<div className="transition-transform hover:scale-[1.03] duration-200">
								<Button
									variant="outline"
									className="w-full hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors text-blue-900 dark:text-blue-50 hover:text-blue-900 dark:hover:text-blue-100 border-blue-200 dark:border-blue-800"
								>
									<Link
										href="/courses"
										className="w-full flex items-center justify-center"
									>
										View All Courses
										<ChevronRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Card 2 - Professors */}
				<div className="transition-all hover:-translate-y-1 hover:shadow-lg duration-200">
					<div className="absolute inset-0 bg-purple-400/5 blur-xl rounded-xl -z-10 transform scale-95"></div>
					<Card className="h-full border border-purple-100 dark:border-purple-900 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
						<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-400/20 to-pink-400/5 rounded-bl-[var(--radius)] transform translate-x-4 -translate-y-4"></div>
						<CardHeader className="pb-3 relative z-10">
							<CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
								<Users className="h-5 w-5" />
								Professor Reviews
							</CardTitle>
							<CardDescription>
								See what others say about professors
							</CardDescription>
						</CardHeader>
						<CardContent className="relative z-10">
							<div className="transition-transform hover:scale-[1.03] duration-200">
								<Button
									variant="outline"
									className="w-full hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors text-purple-900 dark:text-purple-50 hover:text-purple-900 dark:hover:text-purple-100 border-purple-200 dark:border-purple-800"
								>
									<Link
										href="/professors"
										className="w-full flex items-center justify-center"
									>
										View All Professors
										<ChevronRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Card 3 - Community */}
				<div className="transition-all hover:-translate-y-1 hover:shadow-lg duration-200">
					<div className="absolute inset-0 bg-green-400/5 blur-xl rounded-xl -z-10 transform scale-95"></div>
					<Card className="h-full border border-green-100 dark:border-green-900 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
						<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-400/20 to-emerald-400/5 rounded-bl-[var(--radius)] transform translate-x-4 -translate-y-4"></div>
						<CardHeader className="pb-3 relative z-10">
							<CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<Users className="h-5 w-5" />
								Join the Community
							</CardTitle>
							<CardDescription>
								Log in to rate courses and add reviews
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-2 relative z-10">
							<div className="transition-transform hover:scale-[1.03] duration-200">
								<Button 
									className="w-full bg-gradient-ocean hover:opacity-90 transition-colors text-white shadow-sm"
								>
									<Link href="/login" className="w-full">
										Log In
									</Link>
								</Button>
							</div>
							<div className="transition-transform hover:scale-[1.03] duration-200">
								<Button
									variant="outline"
									className="w-full hover:bg-green-50 dark:hover:bg-green-950 transition-colors text-green-900 dark:text-green-50 hover:text-green-900 dark:hover:text-green-100 border-green-200 dark:border-green-800"
								>
									<Link href="/register" className="w-full">
										Register
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* About Section */}
			<section className="w-full mt-4 mb-8 relative">
				<div className="absolute inset-0 bg-blue-400/5 dark:bg-blue-500/5 blur-xl rounded-xl -z-10 transform scale-[0.98]"></div>
				<div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg p-6 border border-border shadow-sm relative overflow-hidden">
					<div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full"></div>
					<div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-tr from-indigo-500/5 to-pink-500/5 rounded-full"></div>

					<h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
						<div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full">
							<Info className="h-5 w-5 text-blue-500" />
						</div>
						About Whispr
					</h3>
					<p className="mb-3 relative z-10">
						Whispr is the unofficial review platform for IIIT-Hyderabad courses
						and professors. Browse and search for courses without logging in, but
						join the community to share your own experiences.
					</p>
					<p className="text-muted-foreground relative z-10">
						All reviews are anonymous to ensure honest feedback, but login is
						required to prevent spam and maintain quality.
					</p>

					<div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-3">
						<div className="flex items-center gap-2 text-sm text-muted-foreground px-2.5 py-1 bg-green-50/50 dark:bg-green-900/20 rounded-full">
							<TrendingUp className="h-4 w-4 text-green-500" />
							<span>Updated live</span>
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground px-2.5 py-1 bg-blue-50/50 dark:bg-blue-900/20 rounded-full">
							<MessageCircle className="h-4 w-4 text-blue-500" />
							<span>Anonymous feedback</span>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="w-full text-center pt-6 pb-4 border-t border-border">
				<p className="text-xs text-muted-foreground">
					© {new Date().getFullYear()} Whispr. Built by students for students.
				</p>
			</footer>
		</main>
	);
}
