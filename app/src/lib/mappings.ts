/**
 * Utility functions for mapping between backend and frontend data formats
 */

/**
 * Converts a string vote type ("up" or "down") to a boolean for the backend API
 * @param voteType The string vote type
 * @returns Boolean representation (true for "up", false for "down")
 */
export function stringVoteTypeToBoolean(voteType: string): boolean {
  return voteType === "up";
}

/**
 * Converts a boolean vote type from the backend to a string for the frontend
 * @param voteType The boolean vote type
 * @returns String representation ("up" for true, "down" for false)
 */
export function booleanVoteTypeToString(voteType: boolean): "up" | "down" {
  return voteType ? "up" : "down";
}

/**
 * Converts string report type to backend enum format
 * Ensures type safety when sending report types to backend
 * @param reportType The string report type
 * @returns Valid backend report type or "other" as fallback
 */
export function validateReportType(
  reportType: string
): "spam" | "harassment" | "inappropriate" | "misinformation" | "other" {
  const validReportTypes = [
    "spam",
    "harassment",
    "inappropriate",
    "misinformation",
    "other",
  ];

  if (validReportTypes.includes(reportType)) {
    return reportType as
      | "spam"
      | "harassment"
      | "inappropriate"
      | "misinformation"
      | "other";
  }

  return "other";
}
