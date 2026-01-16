/**
 * Check if required data exists for timetable generation
 * Run with: node backend/scripts/checkData.js
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Timeslot = require('../models/Timeslot');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scts');
    console.log('MongoDB Connected\n');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const checkData = async () => {
  try {
    await connectDB();

    console.log('📊 Checking Data for Timetable Generation...\n');

    // Check all data
    const [allSubjects, allFaculty, allClassrooms, allTimeslots] = await Promise.all([
      Subject.find({ isActive: true }),
      Faculty.find({ isActive: true }),
      Classroom.find({ isActive: true }),
      Timeslot.find({ isActive: true })
    ]);

    console.log('📚 Overall Statistics:');
    console.log(`   Subjects: ${allSubjects.length}`);
    console.log(`   Faculty: ${allFaculty.length}`);
    console.log(`   Classrooms: ${allClassrooms.length}`);
    console.log(`   Timeslots: ${allTimeslots.length}\n`);

    // Check by department
    const departments = [...new Set(allSubjects.map(s => s.department))];
    
    if (departments.length === 0) {
      console.log('❌ No departments found in subjects\n');
    } else {
      console.log('🏫 Department-wise Data:\n');
      
      for (const dept of departments) {
        const deptSubjects = allSubjects.filter(s => s.department === dept);
        const deptFaculty = allFaculty.filter(f => f.department === dept);
        const semesters = [...new Set(deptSubjects.map(s => s.semester))];
        
        console.log(`   Department: ${dept}`);
        console.log(`     Subjects: ${deptSubjects.length}`);
        console.log(`     Faculty: ${deptFaculty.length}`);
        console.log(`     Semesters: ${semesters.join(', ')}`);
        
        for (const sem of semesters) {
          const semSubjects = deptSubjects.filter(s => s.semester === sem);
          const withFaculty = semSubjects.filter(s => s.assignedFaculty && s.assignedFaculty.length > 0);
          const withClasses = semSubjects.filter(s => s.classesPerWeek > 0);
          
          console.log(`\n     Semester ${sem}:`);
          console.log(`       Total Subjects: ${semSubjects.length}`);
          console.log(`       With Assigned Faculty: ${withFaculty.length}`);
          console.log(`       With Classes Per Week: ${withClasses.length}`);
          
          if (semSubjects.length === 0) {
            console.log(`       ⚠️  No subjects for semester ${sem}`);
          }
          if (withFaculty.length === 0) {
            console.log(`       ⚠️  No subjects with assigned faculty`);
          }
          if (withClasses.length === 0) {
            console.log(`       ⚠️  No subjects with classesPerWeek > 0`);
          }
        }
        console.log('');
      }
    }

    // Recommendations
    console.log('💡 Recommendations:\n');
    
    if (allSubjects.length === 0) {
      console.log('   ❌ Add subjects to the system');
    }
    if (allFaculty.length === 0) {
      console.log('   ❌ Add faculty members to the system');
    }
    if (allClassrooms.length === 0) {
      console.log('   ❌ Add classrooms to the system');
    }
    if (allTimeslots.length === 0) {
      console.log('   ❌ Add timeslots to the system');
    }
    
    if (allSubjects.length > 0 && allFaculty.length > 0 && allClassrooms.length > 0 && allTimeslots.length > 0) {
      console.log('   ✅ All basic data exists!');
      console.log('   ✅ You can generate timetables for departments with:');
      console.log('      - Subjects with assigned faculty');
      console.log('      - Subjects with classesPerWeek > 0');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkData();





