"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Download, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

const mockStats = {
  totalUsers: 1247,
  verifiedUsers: 892,
  totalReviews: 3456,
  totalCourses: 156,
  totalProfessors: 89,
  reportedContent: 23,
  dailyActiveUsers: 234,
  weeklySignups: 45
};

const mockReports = [
  {
    id: "1",
    type: "review",
    content: "This is spam content...",
    reportedBy: "anonymous_user",
    reason: "Spam",
    createdAt: "2024-01-20T10:30:00Z",
    status: "pending"
  },
  {
    id: "2", 
    type: "user",
    content: "username: bad_actor",
    reportedBy: "concerned_student",
    reason: "Harassment",
    createdAt: "2024-01-19T15:45:00Z",
    status: "under_review"
  }
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [reports, setReports] = useState(mockReports);

  const handleReportAction = (reportId: string, action: "approve" | "reject") => {
    setReports(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, status: action === "approve" ? "resolved" : "rejected" }
          : report
      )
    );
  };

  const generateBackup = async () => {
    console.log("Generating backup...");
    // TODO: Implement backup generation
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "reports", label: "Reports", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "backup", label: "Backup", icon: <Download className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-secondary">
            Manage users, content, and platform settings
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 bg-card border border-primary/20 rounded-xl p-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-black'
                  : 'text-secondary hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Users", value: mockStats.totalUsers, icon: <Users className="w-6 h-6" />, color: "text-blue-500" },
                  { label: "Verified Users", value: mockStats.verifiedUsers, icon: <Shield className="w-6 h-6" />, color: "text-green-500" },
                  { label: "Total Reviews", value: mockStats.totalReviews, icon: <TrendingUp className="w-6 h-6" />, color: "text-purple-500" },
                  { label: "Reported Content", value: mockStats.reportedContent, icon: <AlertTriangle className="w-6 h-6" />, color: "text-red-500" }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={stat.color}>{stat.icon}</div>
                      <span className="text-2xl font-bold">{stat.value.toLocaleString()}</span>
                    </div>
                    <h3 className="font-medium text-secondary">{stat.label}</h3>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    "New user registration: anonymous_student",
                    "Review reported: CS101 review by network_ninja", 
                    "User verified: systems_guru",
                    "Admin action: Backup generated"
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 py-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-secondary">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">User Management</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">anonymous_whisperer</div>
                    <div className="text-sm text-secondary">Trusted Whisperer • 450 echoes</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary px-3 py-1 text-sm">View</button>
                    <button className="btn text-red-400 border-red-400/50 px-3 py-1 text-sm">Mute</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">network_ninja</div>
                    <div className="text-sm text-secondary">Silent Force • 1,234 echoes</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary px-3 py-1 text-sm">View</button>
                    <button className="btn text-red-400 border-red-400/50 px-3 py-1 text-sm">Mute</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              {reports.map((report) => (
                <div key={report.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium capitalize">{report.type} Report</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          report.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                          report.status === "under_review" ? "bg-blue-500/20 text-blue-400" :
                          "bg-green-500/20 text-green-400"
                        }`}>
                          {report.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-secondary text-sm mb-2">
                        Reported by: {report.reportedBy} • Reason: {report.reason}
                      </p>
                      <p className="bg-muted p-3 rounded-lg text-sm">{report.content}</p>
                    </div>
                  </div>
                  
                  {report.status === "pending" && (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleReportAction(report.id, "approve")}
                        className="btn text-green-400 border-green-400/50 hover:bg-green-400/10 px-4 py-2"
                      >
                        Take Action
                      </button>
                      <button 
                        onClick={() => handleReportAction(report.id, "reject")}
                        className="btn btn-secondary px-4 py-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "backup" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Data Backup</h3>
              <div className="space-y-4">
                <p className="text-secondary">
                  Generate and download a backup of all platform data including users, reviews, and system settings.
                </p>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-yellow-400">Important</span>
                  </div>
                  <p className="text-sm text-yellow-300">
                    Backups contain anonymized data only. No personal information or email addresses are included.
                  </p>
                </div>
                
                <button 
                  onClick={generateBackup}
                  className="btn btn-primary px-6 py-3 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Generate Backup
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}