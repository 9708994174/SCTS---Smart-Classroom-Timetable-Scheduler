/**
 * Constraint Satisfaction Programming (CSP) module
 * Enforces hard constraints and repairs violations
 */

/**
 * Check all hard constraints
 */
function checkConstraints(chromosome, courseSessions, faculty, classrooms, timeslots) {
  const violations = [];

  // Check 1: No faculty double-booking
  const facultyTimeMap = new Map();
  chromosome.forEach((gene, index) => {
    const session = courseSessions[index];
    if (session.requiredFaculty && session.requiredFaculty.length > 0) {
      const timeslot = timeslots[gene.timeslotIndex];
      session.requiredFaculty.forEach(f => {
        const facultyId = f._id ? f._id.toString() : f.toString();
        const key = `${facultyId}-${timeslot.day}-${timeslot.startTime}`;
        
        if (facultyTimeMap.has(key)) {
          violations.push({
            type: 'faculty_conflict',
            session: session.sessionID,
            faculty: facultyId,
            timeslot: timeslot._id,
            message: `Faculty ${facultyId} double-booked at ${timeslot.day} ${timeslot.startTime}`
          });
        } else {
          facultyTimeMap.set(key, true);
        }
      });
    }
  });

  // Check 2: No classroom double-booking
  const roomTimeMap = new Map();
  chromosome.forEach((gene, index) => {
    const timeslot = timeslots[gene.timeslotIndex];
    const key = `${gene.classroomIndex}-${timeslot.day}-${timeslot.startTime}`;
    
    if (roomTimeMap.has(key)) {
      violations.push({
        type: 'room_conflict',
        session: courseSessions[index].sessionID,
        classroom: gene.classroomIndex,
        timeslot: timeslot._id,
        message: `Classroom ${gene.classroomIndex} double-booked at ${timeslot.day} ${timeslot.startTime}`
      });
    } else {
      roomTimeMap.set(key, true);
    }
  });

  // Check 3: Capacity constraints
  chromosome.forEach((gene, index) => {
    const session = courseSessions[index];
    const classroom = classrooms[gene.classroomIndex];
    
    if (classroom && session.enrollment > classroom.capacity) {
      violations.push({
        type: 'capacity_violation',
        session: session.sessionID,
        enrollment: session.enrollment,
        capacity: classroom.capacity,
        message: `Enrollment ${session.enrollment} exceeds capacity ${classroom.capacity}`
      });
    }
  });

  // Check 4: Faculty availability
  chromosome.forEach((gene, index) => {
    const session = courseSessions[index];
    const timeslot = timeslots[gene.timeslotIndex];
    
    if (session.requiredFaculty && session.requiredFaculty.length > 0) {
      session.requiredFaculty.forEach(f => {
        const facultyMember = faculty.find(fac => 
          (fac._id && fac._id.toString() === (f._id ? f._id.toString() : f.toString())) ||
          fac._id.toString() === f.toString()
        );
        
        if (facultyMember) {
          // Check if faculty is available at this time
          const isAvailable = checkFacultyAvailability(facultyMember, timeslot);
          if (!isAvailable) {
            violations.push({
              type: 'faculty_unavailable',
              session: session.sessionID,
              faculty: facultyMember._id,
              timeslot: timeslot._id,
              message: `Faculty ${facultyMember.name} not available at ${timeslot.day} ${timeslot.startTime}`
            });
          }
        }
      });
    }
  });

  // Check 5: Room type requirements
  chromosome.forEach((gene, index) => {
    const session = courseSessions[index];
    const classroom = classrooms[gene.classroomIndex];
    
    if (session.roomRequirements && classroom) {
      if (session.roomRequirements.roomType !== classroom.roomType) {
        violations.push({
          type: 'room_type_mismatch',
          session: session.sessionID,
          required: session.roomRequirements.roomType,
          assigned: classroom.roomType,
          message: `Room type mismatch: required ${session.roomRequirements.roomType}, got ${classroom.roomType}`
        });
      }
    }
  });

  return violations;
}

/**
 * Check if faculty is available at given timeslot
 */
function checkFacultyAvailability(facultyMember, timeslot) {
  // Check leaves
  const now = new Date();
  if (facultyMember.leaves) {
    for (const leave of facultyMember.leaves) {
      if (leave.status === 'approved' && 
          now >= new Date(leave.startDate) && 
          now <= new Date(leave.endDate)) {
        return false;
      }
    }
  }

  // Check availability slots
  if (facultyMember.availability && facultyMember.availability.length > 0) {
    const slot = facultyMember.availability.find(a => a.day === timeslot.day);
    if (slot && !slot.isAvailable) {
      return false;
    }
    // Check time range
    if (slot && slot.isAvailable) {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      const reqStart = timeToMinutes(timeslot.startTime);
      const reqEnd = timeToMinutes(timeslot.endTime);
      
      if (reqStart < slotStart || reqEnd > slotEnd) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Convert time string to minutes
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Repair constraint violations
 */
function repairViolations(chromosome, courseSessions, faculty, classrooms, timeslots) {
  let repaired = JSON.parse(JSON.stringify(chromosome));
  const maxRepairAttempts = 100;
  let attempts = 0;

  while (attempts < maxRepairAttempts) {
    const violations = checkConstraints(repaired, courseSessions, faculty, classrooms, timeslots);
    
    if (violations.length === 0) {
      break; // All violations repaired
    }

    // Repair one violation at a time
    const violation = violations[0];
    
    if (violation.type === 'faculty_conflict' || violation.type === 'room_conflict') {
      // Try to reassign to a different timeslot
      const sessionIndex = courseSessions.findIndex(s => s.sessionID === violation.session);
      if (sessionIndex !== -1) {
        const newTimeslotIndex = Math.floor(Math.random() * timeslots.length);
        repaired[sessionIndex].timeslotIndex = newTimeslotIndex;
      }
    } else if (violation.type === 'capacity_violation') {
      // Try to assign to a larger classroom
      const sessionIndex = courseSessions.findIndex(s => s.sessionID === violation.session);
      if (sessionIndex !== -1) {
        const session = courseSessions[sessionIndex];
        const suitableRooms = classrooms
          .map((room, idx) => ({ room, idx }))
          .filter(({ room }) => room.capacity >= session.enrollment)
          .map(({ idx }) => idx);
        
        if (suitableRooms.length > 0) {
          repaired[sessionIndex].classroomIndex = suitableRooms[Math.floor(Math.random() * suitableRooms.length)];
        }
      }
    } else if (violation.type === 'room_type_mismatch') {
      // Find suitable room type
      const sessionIndex = courseSessions.findIndex(s => s.sessionID === violation.session);
      if (sessionIndex !== -1) {
        const session = courseSessions[sessionIndex];
        const suitableRooms = classrooms
          .map((room, idx) => ({ room, idx }))
          .filter(({ room }) => room.roomType === session.roomRequirements.roomType)
          .map(({ idx }) => idx);
        
        if (suitableRooms.length > 0) {
          repaired[sessionIndex].classroomIndex = suitableRooms[Math.floor(Math.random() * suitableRooms.length)];
        }
      }
    }

    attempts++;
  }

  return repaired;
}

module.exports = { checkConstraints, repairViolations, checkFacultyAvailability };




