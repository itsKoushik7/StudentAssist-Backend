const unitKeywords = {
  1: [
    "network hardware",
    "network software",
    "osi",
    "tcp/ip",
    "arpanet",
    "internet",
    "twisted pair",
    "coaxial",
    "fiber optics",
    "guided media",
    "physical layer",
    "wireless transmission",
  ],
  2: [
    "data link",
    "framing",
    "error detection",
    "error correction",
    "simplex",
    "stop and wait",
    "sliding window",
    "go-back-n",
    "selective repeat",
    "medium access",
    "aloha",
    "csma",
    "collision",
    "wireless lan",
    "link layer switching",
  ],
  3: [
    "network layer",
    "routing",
    "shortest path",
    "flooding",
    "hierarchical routing",
    "broadcast",
    "multicast",
    "distance vector",
    "congestion control",
    "quality of service",
    "internetworking",
  ],
  4: [
    "transport layer",
    "connection management",
    "tcp",
    "udp",
    "transport protocols",
    "transport services",
  ],
  5: [
    "application layer",
    "dns",
    "snmp",
    "email",
    "electronic mail",
    "http",
    "world web",
    "web",
    "streaming",
    "audio",
    "video",
  ],
};

function classifyUnit(question) {
  const lower = question.toLowerCase();

  for (const [unitNumber, keywords] of Object.entries(unitKeywords)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return parseInt(unitNumber); // 🔥 Return integer
      }
    }
  }

  return "Unknown Unit"; // Still fallback for ML
}

module.exports = { classifyUnit };
