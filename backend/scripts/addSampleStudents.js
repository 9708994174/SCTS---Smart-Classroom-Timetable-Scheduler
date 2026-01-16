const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const sampleStudents = [
  // CSE Semester 2
  { name: 'John Doe', email: 'john.doe@student.edu', uid: 'STU001', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Jane Smith', email: 'jane.smith@student.edu', uid: 'STU002', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Mike Johnson', email: 'mike.johnson@student.edu', uid: 'STU003', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Sarah Williams', email: 'sarah.williams@student.edu', uid: 'STU004', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'David Brown', email: 'david.brown@student.edu', uid: 'STU005', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Emily Davis', email: 'emily.davis@student.edu', uid: 'STU006', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Chris Wilson', email: 'chris.wilson@student.edu', uid: 'STU007', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Lisa Anderson', email: 'lisa.anderson@student.edu', uid: 'STU008', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Robert Taylor', email: 'robert.taylor@student.edu', uid: 'STU009', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Amanda Martinez', email: 'amanda.martinez@student.edu', uid: 'STU010', department: 'CSE', semester: 2, program: 'UG', password: 'password123' },
  
  // CSE Semester 1
  { name: 'Alex Thompson', email: 'alex.thompson@student.edu', uid: 'STU011', department: 'CSE', semester: 1, program: 'UG', password: 'password123' },
  { name: 'Jessica Lee', email: 'jessica.lee@student.edu', uid: 'STU012', department: 'CSE', semester: 1, program: 'UG', password: 'password123' },
  { name: 'Michael Chen', email: 'michael.chen@student.edu', uid: 'STU013', department: 'CSE', semester: 1, program: 'UG', password: 'password123' },
  { name: 'Rachel Green', email: 'rachel.green@student.edu', uid: 'STU014', department: 'CSE', semester: 1, program: 'UG', password: 'password123' },
  { name: 'Daniel White', email: 'daniel.white@student.edu', uid: 'STU015', department: 'CSE', semester: 1, program: 'UG', password: 'password123' },
  
  // ECE Semester 2
  { name: 'Sophia Garcia', email: 'sophia.garcia@student.edu', uid: 'STU016', department: 'ECE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'James Rodriguez', email: 'james.rodriguez@student.edu', uid: 'STU017', department: 'ECE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Olivia Martinez', email: 'olivia.martinez@student.edu', uid: 'STU018', department: 'ECE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'William Jackson', email: 'william.jackson@student.edu', uid: 'STU019', department: 'ECE', semester: 2, program: 'UG', password: 'password123' },
  { name: 'Isabella Harris', email: 'isabella.harris@student.edu', uid: 'STU020', department: 'ECE', semester: 2, program: 'UG', password: 'password123' },
];

const addSampleStudents = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scts', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Clear existing sample students (optional - comment out if you want to keep existing)
    // await User.deleteMany({ email: { $regex: '@student.edu' } });
    // console.log('Cleared existing sample students');

    let added = 0;
    let skipped = 0;

    for (const studentData of sampleStudents) {
      try {
        // Check if student already exists
        const existing = await User.findOne({ 
          $or: [
            { email: studentData.email },
            { uid: studentData.uid }
          ]
        });

        if (existing) {
          console.log(`⏭️  Skipped: ${studentData.name} (already exists)`);
          skipped++;
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(studentData.password, 10);

        // Create student
        const student = await User.create({
          ...studentData,
          password: hashedPassword,
          role: 'student',
          isActive: true
        });

        console.log(`✅ Added: ${student.name} (${student.email}) - ${student.department} Sem ${student.semester}`);
        added++;
      } catch (error) {
        console.error(`❌ Error adding ${studentData.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Added: ${added} students`);
    console.log(`   ⏭️  Skipped: ${skipped} students`);
    console.log(`   📝 Total: ${sampleStudents.length} students processed`);

    // Show statistics
    const stats = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: { department: '$department', semester: '$semester' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.department': 1, '_id.semester': 1 } }
    ]);

    console.log('\n📈 Student Statistics by Department and Semester:');
    stats.forEach(stat => {
      console.log(`   ${stat._id.department} - Semester ${stat._id.semester}: ${stat.count} students`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  addSampleStudents();
}

module.exports = addSampleStudents;



