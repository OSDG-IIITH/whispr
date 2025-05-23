"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Star, GraduationCap, Plus } from "lucide-react";
import Link from "next/link";

interface Professor {
  id: string;
  name: string;
  lab: string;
  averageRating: number;
  reviewCount: number;
  courses: string[];
  researchAreas: string[];
}

const mockProfessors: Professor[] = [
  {
    id: "1",
    name: "Dr. Network Expert",
    lab: "Networking Lab",
    averageRating: 4.5,
    reviewCount: 34,
    courses: ["CS101", "CS301", "CS501"],
    researchAreas: ["Computer Networks", "Distributed Systems", "IoT"]
  },
  {
    id: "2", 
    name: "Prof. AI Master",
    lab: "Machine Learning Lab",
    averageRating: 4.2,
    reviewCount: 56,
    courses: ["CS201", "CS401", "CS601"],
    researchAreas: ["Machine Learning", "Deep Learning", "Computer Vision"]
  },
  {
    id: "3",
    name: "Dr. Systems Guru",
    lab: "Systems Lab", 
    averageRating: 4.0,
    reviewCount: 28,
    courses: ["CS202", "CS302"],
    researchAreas: ["Operating Systems", "Database Systems", "Compilers"]
  }
];

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState(mockProfessors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState("ALL");
  const [sortBy, setSortBy] = useState("rating");

  const labs = ["ALL", "Networking Lab", "Machine Learning Lab", "Systems Lab"];

  const filteredProfessors = professors.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prof.researchAreas.some(area => area.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLab = selectedLab === "ALL" || prof.lab === selectedLab;
    
    return matchesSearch && matchesLab;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-secondary'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Professors</h1>
          <p className="text-secondary">
            Find and review professors at IIITH
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-primary/20 rounded-xl p-6 mb-8"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search professors or research areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
            </div>
            
            <div>
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="w-full py-3 px-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                {labs.map(lab => (
                  <option key={lab} value={lab}>
                    {lab === "ALL" ? "All Labs" : lab}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Sort Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <span className="text-secondary">Sort by:</span>
            {["rating", "reviews", "name"].map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === option
                    ? 'bg-primary text-black'
                    : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="text-secondary">
            {filteredProfessors.length} professors found
          </div>
        </motion.div>

        {/* Professors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessors.map((professor, index) => (
            <motion.div
              key={professor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link href={`/professors/${professor.id}`}>
                <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{professor.name}</h3>
                      <p className="text-primary text-sm">{professor.lab}</p>
                    </div>
                    <GraduationCap className="w-6 h-6 text-secondary" />
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Research Areas</h4>
                    <div className="flex flex-wrap gap-1">
                      {professor.researchAreas.slice(0, 3).map((area, i) => (
                        <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                          {area}
                        </span>
                      ))}
                      {professor.researchAreas.length > 3 && (
                        <span className="text-xs text-secondary">
                          +{professor.researchAreas.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Courses</h4>
                    <div className="flex flex-wrap gap-1">
                      {professor.courses.slice(0, 3).map((course, i) => (
                        <span key={i} className="bg-muted text-secondary text-xs px-2 py-1 rounded">
                          {course}
                        </span>
                      ))}
                      {professor.courses.length > 3 && (
                        <span className="text-xs text-secondary">
                          +{professor.courses.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(professor.averageRating)}
                      </div>
                      <span className="text-sm font-medium">
                        {professor.averageRating.toFixed(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-secondary">
                      <Users className="w-4 h-4" />
                      <span>{professor.reviewCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProfessors.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <GraduationCap className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No professors found</h3>
            <p className="text-secondary">
              Try adjusting your search criteria or filters
            </p>
          </motion.div>
        )}

        {/* Floating Add Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-32 right-6 bg-primary text-black p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}