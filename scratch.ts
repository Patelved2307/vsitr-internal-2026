const teams = [
  {
    id: "TEAM-1",
    leader: { enrollmentNo: "123" },
    members: [{ enrollmentNo: "225SBECE54005" }]
  },
  {
    id: "TEAM-2",
    leader: { enrollmentNo: "456" },
    members: [{ enrollmentNo: "old-enr" }]
  }
];

// simulate incoming edit for TEAM-2
const incomingMembers = [{ enrollmentNo: "225sbece54005" }];

const incomingEnrollments = incomingMembers
  .map((m: any) => String(m.enrollmentNo || '').trim().toUpperCase())
  .filter(Boolean);

let error = null;
const teamId = "TEAM-2";

for (const enr of incomingEnrollments) {
  for (const t of teams) {
    if (t.id.toUpperCase() === teamId.toUpperCase()) continue;
    const otherMembers = [t.leader, ...t.members];
    if (otherMembers.some((m) => String(m.enrollmentNo || '').trim().toUpperCase() === enr)) {
      error = `Enrollment number ${enr} is already registered in team "${t.id}".`;
    }
  }
}

console.log(error || "Edit Successful!");
