/**
 * Intelligent Classroom Allocation Algorithm
 * Matches courses to appropriate classrooms based on multiple factors
 */

/**
 * Allocate classrooms to scheduled courses
 */
async function allocateClassrooms(chromosome, courseSessions, classrooms, timeslots) {
  const allocated = JSON.parse(JSON.stringify(chromosome));
  
  // Group sessions by timeslot
  const sessionsByTimeslot = new Map();
  
  allocated.forEach((gene, index) => {
    const timeslotKey = gene.timeslotIndex;
    if (!sessionsByTimeslot.has(timeslotKey)) {
      sessionsByTimeslot.set(timeslotKey, []);
    }
    sessionsByTimeslot.get(timeslotKey).push({ gene, session: courseSessions[index], index });
  });

  // Allocate for each timeslot independently
  for (const [timeslotIndex, sessions] of sessionsByTimeslot) {
    const assignments = allocateForTimeslot(sessions, classrooms);
    
    // Update chromosome with optimal assignments
    assignments.forEach(({ index, classroomIndex }) => {
      allocated[index].classroomIndex = classroomIndex;
    });
  }

  return allocated;
}

/**
 * Allocate classrooms for a single timeslot (Hungarian algorithm approach)
 */
function allocateForTimeslot(sessions, classrooms) {
  const assignments = [];
  const usedRooms = new Set();

  // Sort sessions by priority (enrollment size, equipment needs)
  const sortedSessions = sessions
    .map(({ gene, session, index }) => ({
      gene,
      session,
      index,
      priority: calculateSessionPriority(session)
    }))
    .sort((a, b) => b.priority - a.priority);

  // Greedy assignment with preference scoring
  sortedSessions.forEach(({ gene, session, index }) => {
    const candidates = findCandidateRooms(session, classrooms, usedRooms);
    
    if (candidates.length > 0) {
      // Score and select best room
      const scored = candidates.map(room => ({
        roomIndex: room.index,
        score: calculatePreferenceScore(session, room.room)
      }));
      
      scored.sort((a, b) => b.score - a.score);
      const bestRoom = scored[0];
      
      assignments.push({
        index,
        classroomIndex: bestRoom.roomIndex
      });
      
      usedRooms.add(bestRoom.roomIndex);
    } else {
      // Fallback: use original assignment
      assignments.push({
        index,
        classroomIndex: gene.classroomIndex
      });
    }
  });

  return assignments;
}

/**
 * Calculate session priority for allocation order
 */
function calculateSessionPriority(session) {
  let priority = 0;
  
  // Higher enrollment = higher priority
  priority += session.enrollment * 10;
  
  // Special equipment needs = higher priority
  if (session.roomRequirements && session.roomRequirements.requiredEquipment) {
    priority += session.roomRequirements.requiredEquipment.length * 50;
  }
  
  // Lab sessions = higher priority (fewer suitable rooms)
  if (session.roomRequirements && session.roomRequirements.roomType === 'laboratory') {
    priority += 100;
  }
  
  return priority;
}

/**
 * Find candidate rooms for a session
 */
function findCandidateRooms(session, classrooms, usedRooms) {
  return classrooms
    .map((room, index) => ({ room, index }))
    .filter(({ room, index }) => {
      // Not already used
      if (usedRooms.has(index)) return false;
      
      // Capacity check
      if (room.capacity < session.enrollment) return false;
      
      // Room type check
      if (session.roomRequirements && 
          session.roomRequirements.roomType &&
          room.roomType !== session.roomRequirements.roomType) {
        return false;
      }
      
      // Equipment check
      if (session.roomRequirements && session.roomRequirements.requiredEquipment) {
        for (const equipment of session.roomRequirements.requiredEquipment) {
          if (!room.equipment[equipment] && 
              !room.equipment.specializedEquipment?.includes(equipment)) {
            return false;
          }
        }
      }
      
      // Accessibility check
      if (session.roomRequirements && session.roomRequirements.accessibilityNeeded) {
        if (!room.accessibility.wheelchairAccessible) return false;
      }
      
      return true;
    });
}

/**
 * Calculate preference score for room assignment
 * Formula: S = α·s_capacity + β·s_location + γ·s_equipment
 */
function calculatePreferenceScore(session, room) {
  const alpha = 0.5; // Capacity weight
  const beta = 0.2;  // Location weight
  const gamma = 0.3; // Equipment weight

  // Capacity score (penalize oversized rooms)
  const capacityRatio = session.enrollment / room.capacity;
  const capacityScore = capacityRatio >= 0.8 && capacityRatio <= 1.0 ? 1.0 : 
                       capacityRatio > 1.0 ? 0 : 
                       capacityRatio; // Prefer rooms that are 80-100% full

  // Location score (simplified - could use building/department proximity)
  const locationScore = 0.8; // Default, could be enhanced with actual location data

  // Equipment score (reward rooms with additional useful equipment)
  let equipmentScore = 0.5; // Base score
  if (session.roomRequirements && session.roomRequirements.requiredEquipment) {
    const hasAllRequired = session.roomRequirements.requiredEquipment.every(eq => 
      room.equipment[eq] || room.equipment.specializedEquipment?.includes(eq)
    );
    if (hasAllRequired) equipmentScore = 1.0;
  }
  
  // Bonus for additional equipment
  if (room.equipment.smartBoard) equipmentScore += 0.1;
  if (room.equipment.projector) equipmentScore += 0.1;
  if (room.equipment.airConditioning) equipmentScore += 0.05;

  const totalScore = 
    alpha * capacityScore + 
    beta * locationScore + 
    gamma * Math.min(1.0, equipmentScore);

  return totalScore;
}

module.exports = { allocateClassrooms, calculatePreferenceScore };




