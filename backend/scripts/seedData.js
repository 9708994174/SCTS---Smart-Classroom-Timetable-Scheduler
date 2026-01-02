/**
 * Seed script for initial database setup
 * Run with: node backend/scripts/seedData.js
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const Timeslot = require('../models/Timeslot');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scts');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Faculty.deleteMany({});
    // await Classroom.deleteMany({});
    // await Subject.deleteMany({});
    // await Timeslot.deleteMany({});

    // Create Admin User
    const adminUser = await User.findOne({ email: 'admin@scts.com' });
    if (!adminUser) {
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@scts.com',
        password: 'admin123',
        role: 'admin',
        department: 'Administration'
      });
      console.log('Admin user created:', admin.email);
    } else {
      console.log('Admin user already exists');
    }

    // Create Sample Timeslots
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '12:00', end: '13:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' }
    ];

    const existingTimeslots = await Timeslot.countDocuments();
    if (existingTimeslots === 0) {
      const timeslotData = [];
      days.forEach(day => {
        timeSlots.forEach((slot, idx) => {
          timeslotData.push({
            timeslotID: `TS-${day.substring(0, 3)}-${idx + 1}`,
            day: day,
            startTime: slot.start,
            endTime: slot.end,
            shift: 'morning'
          });
        });
      });
      await Timeslot.insertMany(timeslotData);
      console.log('Timeslots created');
    } else {
      console.log('Timeslots already exist');
    }

    // Create Sample Classrooms
    const existingClassrooms = await Classroom.countDocuments();
    if (existingClassrooms === 0) {
      const classrooms = [
        { roomID: 'CSE-101', building: 'CSE Building', capacity: 60, roomType: 'lecture', floor: 1 },
        { roomID: 'CSE-102', building: 'CSE Building', capacity: 60, roomType: 'lecture', floor: 1 },
        { roomID: 'CSE-201', building: 'CSE Building', capacity: 40, roomType: 'lecture', floor: 2 },
        { roomID: 'CSE-LAB1', building: 'CSE Building', capacity: 30, roomType: 'laboratory', floor: 1 },
        { roomID: 'CSE-LAB2', building: 'CSE Building', capacity: 30, roomType: 'laboratory', floor: 1 },
        { roomID: 'AUD-101', building: 'Main Building', capacity: 200, roomType: 'auditorium', floor: 1 }
      ];

      const classroomData = classrooms.map(room => ({
        ...room,
        equipment: {
          smartBoard: room.roomType === 'lecture',
          projector: true,
          airConditioning: true,
          wifi: true
        }
      }));

      await Classroom.insertMany(classroomData);
      console.log('Classrooms created');
    } else {
      console.log('Classrooms already exist');
    }

    console.log('Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();




