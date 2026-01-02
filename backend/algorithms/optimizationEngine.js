const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Timeslot = require('../models/Timeslot');
const Timetable = require('../models/Timetable');
const { allocateClassrooms } = require('./classroomAllocation');
const { checkConstraints, repairViolations } = require('./constraintSatisfaction');

/**
 * Main timetable generation function using GA-CSP hybrid approach
 */
async function generateTimetable({ academicYear, semester, department, config = {} }) {
  // Configuration parameters
  const {
    populationSize = 50,
    maxGenerations = 100,
    mutationRate = 0.1,
    crossoverRate = 0.8,
    fitnessWeights = {
      utilization: 0.3,
      balance: 0.3,
      preference: 0.2,
      penalty: 0.2
    },
    convergenceThreshold = 0.95
  } = config;

  // Fetch all required data
  const [subjects, faculty, classrooms, timeslots] = await Promise.all([
    Subject.find({ 
      isActive: true, 
      department,
      semester 
    }).populate('assignedFaculty'),
    Faculty.find({ 
      isActive: true,
      department 
    }),
    Classroom.find({ isActive: true }),
    Timeslot.find({ isActive: true })
  ]);

  // Detailed error messages for missing data
  const missingData = [];
  if (subjects.length === 0) {
    missingData.push(`No active subjects found for department "${department}" and semester ${semester}`);
  }
  if (faculty.length === 0) {
    missingData.push(`No active faculty found for department "${department}"`);
  }
  if (classrooms.length === 0) {
    missingData.push('No active classrooms found in the system');
  }
  if (timeslots.length === 0) {
    missingData.push('No active timeslots found in the system');
  }

  if (missingData.length > 0) {
    throw new Error(`Insufficient data for timetable generation:\n${missingData.join('\n')}\n\nPlease add the required data before generating timetables.`);
  }

  // Check if subjects have assigned faculty
  const subjectsWithoutFaculty = subjects.filter(s => !s.assignedFaculty || s.assignedFaculty.length === 0);
  if (subjectsWithoutFaculty.length > 0) {
    throw new Error(`The following subjects have no assigned faculty: ${subjectsWithoutFaculty.map(s => s.subjectName).join(', ')}. Please assign faculty to all subjects.`);
  }

  // Generate course sessions (each subject needs multiple sessions per week)
  const courseSessions = generateCourseSessions(subjects);
  
  if (courseSessions.length === 0) {
    throw new Error('No course sessions generated. Please ensure subjects have classesPerWeek > 0.');
  }

  console.log(`Generated ${courseSessions.length} course sessions from ${subjects.length} subjects`);

  // Initialize population
  let population = initializePopulation(
    courseSessions,
    timeslots,
    classrooms,
    populationSize
  );
  
  if (!population || population.length === 0) {
    throw new Error('Failed to initialize population for genetic algorithm');
  }

  let bestFitness = 0;
  let bestChromosome = null;
  let generation = 0;
  let convergenceCount = 0;

  // GA Evolution Loop
  while (generation < maxGenerations) {
    let fitnessScores;
    
    try {
      // Evaluate fitness for all chromosomes
      fitnessScores = population.map((chromosome, index) => {
        try {
          const fitness = evaluateFitness(
            chromosome,
            courseSessions,
            faculty,
            classrooms,
            timeslots,
            fitnessWeights
          );
          return { chromosome, fitness, index };
        } catch (error) {
          console.error(`Error evaluating fitness for chromosome ${index}:`, error);
          return { chromosome, fitness: 0, index }; // Assign low fitness on error
        }
      });

      if (fitnessScores.length === 0) {
        throw new Error('No fitness scores calculated');
      }

      // Sort by fitness (higher is better)
      fitnessScores.sort((a, b) => b.fitness - a.fitness);

      // Update best solution
      if (fitnessScores[0].fitness > bestFitness) {
        bestFitness = fitnessScores[0].fitness;
        bestChromosome = JSON.parse(JSON.stringify(fitnessScores[0].chromosome));
        convergenceCount = 0;
      } else {
        convergenceCount++;
      }

      // Check convergence
      if (bestFitness >= convergenceThreshold || convergenceCount >= 20) {
        console.log(`Converged at generation ${generation} with fitness ${bestFitness}`);
        break;
      }

      // Selection (keep top 20% elite)
      const eliteSize = Math.max(1, Math.floor(populationSize * 0.2));
      const elite = fitnessScores.slice(0, eliteSize).map(item => item.chromosome);

      // Generate new population
      const newPopulation = [...elite];

      while (newPopulation.length < populationSize) {
        try {
          // Tournament selection
          const parent1 = tournamentSelection(fitnessScores, 3);
          const parent2 = tournamentSelection(fitnessScores, 3);

          // Crossover
          let [child1, child2] = crossover(parent1, parent2, crossoverRate);

          // Mutation
          child1 = mutate(child1, mutationRate, timeslots.length, classrooms.length);
          child2 = mutate(child2, mutationRate, timeslots.length, classrooms.length);

          // CSP: Check and repair constraints
          try {
            child1 = repairViolations(child1, courseSessions, faculty, classrooms, timeslots);
            child2 = repairViolations(child2, courseSessions, faculty, classrooms, timeslots);
          } catch (error) {
            console.error('Error in constraint repair:', error);
            // Use original children if repair fails
          }

          newPopulation.push(child1);
          if (newPopulation.length < populationSize) {
            newPopulation.push(child2);
          }
        } catch (error) {
          console.error('Error generating new population member:', error);
          // Add a random valid chromosome if generation fails
          const randomChromosome = courseSessions.map(session => {
            const randomTimeslot = Math.floor(Math.random() * timeslots.length);
            const randomClassroom = Math.floor(Math.random() * classrooms.length);
            return {
              sessionID: session.sessionID,
              timeslotIndex: randomTimeslot,
              classroomIndex: randomClassroom
            };
          });
          newPopulation.push(randomChromosome);
        }
      }

      population = newPopulation;
      generation++;
    } catch (error) {
      console.error(`Error in generation ${generation}:`, error);
      // If fitnessScores wasn't calculated, skip this generation
      if (!fitnessScores) {
        generation++;
        continue;
      }
      // Otherwise, try to continue with existing fitnessScores
      generation++;
    }
  }

  // Ensure we have a valid chromosome
  if (!bestChromosome || bestChromosome.length === 0) {
    throw new Error('Failed to generate valid timetable. No solution found after optimization.');
  }

  // CSP Refinement Phase
  bestChromosome = applyCSPRefinement(
    bestChromosome,
    courseSessions,
    faculty,
    classrooms,
    timeslots
  );

  // Allocate classrooms intelligently
  let allocatedSchedule;
  try {
    allocatedSchedule = await allocateClassrooms(
      bestChromosome,
      courseSessions,
      classrooms,
      timeslots
    );
    
    if (!allocatedSchedule || allocatedSchedule.length === 0) {
      throw new Error('Failed to allocate classrooms for timetable entries');
    }

    if (allocatedSchedule.length !== bestChromosome.length) {
      throw new Error(`Allocated schedule length (${allocatedSchedule.length}) does not match chromosome length (${bestChromosome.length})`);
    }
  } catch (error) {
    console.error('Classroom allocation error:', error);
    throw new Error(`Classroom allocation failed: ${error.message}`);
  }

  // Calculate final metrics
  const metrics = calculateMetrics(
    allocatedSchedule,
    courseSessions,
    faculty,
    classrooms,
    timeslots
  );

  // Create timetable entry
  const timetableID = `TT-${academicYear}-${semester}-${department}-${Date.now()}`;
  
  let timetableEntries;
  try {
    timetableEntries = convertToTimetableEntries(
      allocatedSchedule,
      courseSessions,
      timeslots,
      classrooms,
      timetableID
    );

    if (!timetableEntries || timetableEntries.length === 0) {
      throw new Error('Failed to convert schedule to timetable entries');
    }

    console.log(`Created ${timetableEntries.length} timetable entries`);
  } catch (error) {
    console.error('Timetable entry conversion error:', error);
    throw new Error(`Failed to create timetable entries: ${error.message}`);
  }

  // Save timetable
  let timetable;
  try {
    timetable = await Timetable.create({
      timetableID,
      name: `Timetable ${academicYear} Semester ${semester}`,
      academicYear,
      semester,
      department,
      entries: timetableEntries,
      status: 'generated',
      generatedBy: config.userId,
      metrics
    });
    console.log('Timetable saved successfully:', timetable._id);
  } catch (error) {
    console.error('Timetable save error:', error);
    throw new Error(`Failed to save timetable to database: ${error.message}`);
  }

  return {
    timetable: timetable._id,
    timetableID,
    fitness: bestFitness,
    metrics,
    generation,
    message: 'Timetable generated successfully'
  };
}

/**
 * Generate course sessions (each subject needs multiple classes per week)
 */
function generateCourseSessions(subjects) {
  const sessions = [];
  let sessionIndex = 0;

  subjects.forEach(subject => {
    for (let i = 0; i < subject.classesPerWeek; i++) {
      sessions.push({
        sessionID: `S${sessionIndex++}`,
        subjectID: subject._id,
        subject: subject,
        requiredFaculty: subject.assignedFaculty || [],
        enrollment: subject.enrollment || 0,
        roomRequirements: subject.roomRequirements
      });
    }
  });

  return sessions;
}

/**
 * Initialize population with random valid assignments
 */
function initializePopulation(courseSessions, timeslots, classrooms, populationSize) {
  const population = [];

  for (let i = 0; i < populationSize; i++) {
    const chromosome = courseSessions.map(session => {
      const randomTimeslot = Math.floor(Math.random() * timeslots.length);
      const randomClassroom = Math.floor(Math.random() * classrooms.length);
      return {
        sessionID: session.sessionID,
        timeslotIndex: randomTimeslot,
        classroomIndex: randomClassroom
      };
    });
    population.push(chromosome);
  }

  return population;
}

/**
 * Evaluate fitness using multi-objective function
 */
function evaluateFitness(chromosome, courseSessions, faculty, classrooms, timeslots, weights) {
  // Calculate utilization
  const utilization = calculateUtilization(chromosome, classrooms, timeslots);

  // Calculate workload balance
  const balance = calculateWorkloadBalance(chromosome, courseSessions, faculty, timeslots);

  // Calculate preference satisfaction
  const preference = calculatePreferenceSatisfaction(chromosome, courseSessions, faculty, timeslots);

  // Calculate constraint violations (penalty)
  const violations = checkConstraints(chromosome, courseSessions, faculty, classrooms, timeslots);
  const penalty = 1 - (violations.length / (courseSessions.length * 2)); // Normalize

  // Weighted fitness
  const fitness = 
    weights.utilization * utilization +
    weights.balance * balance +
    weights.preference * preference +
    weights.penalty * penalty;

  return Math.max(0, Math.min(1, fitness)); // Clamp to [0, 1]
}

/**
 * Calculate classroom utilization
 */
function calculateUtilization(chromosome, classrooms, timeslots) {
  const totalSlots = classrooms.length * timeslots.length;
  const usedSlots = new Set();

  chromosome.forEach(gene => {
    const key = `${gene.timeslotIndex}-${gene.classroomIndex}`;
    usedSlots.add(key);
  });

  return usedSlots.size / totalSlots;
}

/**
 * Calculate faculty workload balance
 */
function calculateWorkloadBalance(chromosome, courseSessions, faculty, timeslots) {
  const facultyHours = new Map();

  chromosome.forEach((gene, index) => {
    const session = courseSessions[index];
    if (session.requiredFaculty && session.requiredFaculty.length > 0) {
      session.requiredFaculty.forEach(f => {
        const facultyId = f._id ? f._id.toString() : f.toString();
        facultyHours.set(facultyId, (facultyHours.get(facultyId) || 0) + 1);
      });
    }
  });

  const hours = Array.from(facultyHours.values());
  if (hours.length === 0) return 1;

  const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
  const variance = hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length;
  const stdDev = Math.sqrt(variance);

  // Lower std dev = better balance
  return 1 / (1 + stdDev);
}

/**
 * Calculate preference satisfaction
 */
function calculatePreferenceSatisfaction(chromosome, courseSessions, faculty, timeslots) {
  let satisfied = 0;
  let total = 0;

  chromosome.forEach((gene, index) => {
    const session = courseSessions[index];
    if (session.requiredFaculty && session.requiredFaculty.length > 0) {
      session.requiredFaculty.forEach(f => {
        total++;
        const facultyMember = faculty.find(fac => 
          (fac._id && fac._id.toString() === (f._id ? f._id.toString() : f.toString())) ||
          fac._id.toString() === f.toString()
        );
        
        if (facultyMember && facultyMember.preferences) {
          const timeslot = timeslots[gene.timeslotIndex];
          if (facultyMember.preferences.preferredDays?.includes(timeslot.day)) {
            satisfied++;
          }
        }
      });
    }
  });

  return total > 0 ? satisfied / total : 1;
}

/**
 * Tournament selection
 */
function tournamentSelection(fitnessScores, tournamentSize) {
  const tournament = [];
  for (let i = 0; i < tournamentSize; i++) {
    tournament.push(fitnessScores[Math.floor(Math.random() * fitnessScores.length)]);
  }
  tournament.sort((a, b) => b.fitness - a.fitness);
  return tournament[0].chromosome;
}

/**
 * Crossover operator (two-point crossover)
 */
function crossover(parent1, parent2, crossoverRate) {
  if (Math.random() > crossoverRate) {
    return [parent1, parent2];
  }

  const point1 = Math.floor(Math.random() * parent1.length);
  const point2 = Math.floor(Math.random() * (parent1.length - point1)) + point1;

  const child1 = [
    ...parent1.slice(0, point1),
    ...parent2.slice(point1, point2),
    ...parent1.slice(point2)
  ];

  const child2 = [
    ...parent2.slice(0, point1),
    ...parent1.slice(point1, point2),
    ...parent2.slice(point2)
  ];

  return [child1, child2];
}

/**
 * Mutation operator
 */
function mutate(chromosome, mutationRate, numTimeslots, numClassrooms) {
  return chromosome.map(gene => {
    if (Math.random() < mutationRate) {
      return {
        ...gene,
        timeslotIndex: Math.floor(Math.random() * numTimeslots),
        classroomIndex: Math.floor(Math.random() * numClassrooms)
      };
    }
    return gene;
  });
}

/**
 * Apply CSP refinement to best solution
 */
function applyCSPRefinement(chromosome, courseSessions, faculty, classrooms, timeslots) {
  let refined = JSON.parse(JSON.stringify(chromosome));
  const violations = checkConstraints(refined, courseSessions, faculty, classrooms, timeslots);

  if (violations.length > 0) {
    refined = repairViolations(refined, courseSessions, faculty, classrooms, timeslots);
  }

  return refined;
}

/**
 * Calculate final metrics
 */
function calculateMetrics(schedule, courseSessions, faculty, classrooms, timeslots) {
  const utilization = calculateUtilization(schedule, classrooms, timeslots);
  const balance = calculateWorkloadBalance(schedule, courseSessions, faculty, timeslots);
  const violations = checkConstraints(schedule, courseSessions, faculty, classrooms, timeslots);

  return {
    classroomUtilization: utilization * 100,
    facultyWorkloadBalance: balance * 100,
    conflictCount: violations.length,
    preferenceSatisfaction: calculatePreferenceSatisfaction(schedule, courseSessions, faculty, timeslots) * 100
  };
}

/**
 * Convert chromosome to timetable entries
 */
function convertToTimetableEntries(schedule, courseSessions, timeslots, classrooms, timetableID) {
  if (!schedule || schedule.length === 0) {
    throw new Error('Invalid schedule: schedule is empty or undefined');
  }

  if (schedule.length !== courseSessions.length) {
    throw new Error(`Schedule length (${schedule.length}) does not match course sessions length (${courseSessions.length})`);
  }

  return schedule.map((gene, index) => {
    if (!gene || gene.timeslotIndex === undefined || gene.classroomIndex === undefined) {
      throw new Error(`Invalid gene at index ${index}: missing timeslotIndex or classroomIndex`);
    }

    const session = courseSessions[index];
    if (!session) {
      throw new Error(`Missing session at index ${index}`);
    }

    const timeslot = timeslots[gene.timeslotIndex];
    if (!timeslot) {
      throw new Error(`Invalid timeslot index ${gene.timeslotIndex}. Available timeslots: ${timeslots.length}`);
    }

    const classroom = classrooms[gene.classroomIndex];
    if (!classroom) {
      throw new Error(`Invalid classroom index ${gene.classroomIndex}. Available classrooms: ${classrooms.length}`);
    }
    
    if (!session.subject) {
      throw new Error(`Session at index ${index} has no subject data`);
    }

    const facultyId = session.requiredFaculty && session.requiredFaculty.length > 0 
      ? (session.requiredFaculty[0]._id || session.requiredFaculty[0])
      : null;

    if (!facultyId) {
      throw new Error(`Session at index ${index} (${session.sessionID}) has no assigned faculty`);
    }
    
    return {
      entryID: `${timetableID}-${session.sessionID}`,
      faculty: facultyId,
      subject: session.subjectID,
      classroom: classroom._id,
      timeslot: timeslot._id,
      semester: session.subject.semester,
      department: session.subject.department,
      program: session.subject.program
    };
  });
}

module.exports = { generateTimetable };

