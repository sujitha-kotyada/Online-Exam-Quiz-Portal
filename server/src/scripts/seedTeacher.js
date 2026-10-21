const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedTeacher = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_exam_portal';

  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] Connected.');

    const teacherName = process.env.TEACHER_NAME || 'Professor Alan Turing';
    const teacherEmail = (process.env.TEACHER_EMAIL || 'teacher@examportal.edu').toLowerCase().trim();
    const teacherPassword = process.env.TEACHER_PASSWORD || 'Teacher@12345';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(teacherPassword, salt);

    let teacher = await User.findOne({ email: teacherEmail });
    if (teacher) {
      teacher.name = teacherName;
      teacher.passwordHash = passwordHash;
      teacher.role = 'teacher';
      await teacher.save();
      console.log(`[Seed] Updated existing Teacher account: ${teacherEmail}`);
    } else {
      teacher = await User.create({
        name: teacherName,
        email: teacherEmail,
        passwordHash,
        role: 'teacher'
      });
      console.log(`[Seed] Created new Teacher account: ${teacherEmail}`);
    }

    console.log('----------------------------------------------------');
    console.log('Teacher Account Ready:');
    console.log(`  Name:     ${teacher.name}`);
    console.log(`  Email:    ${teacher.email}`);
    console.log(`  Role:     ${teacher.role}`);
    console.log(`  Password: ${teacherPassword}`);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('[Seed Error] Failed to seed teacher:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedTeacher();
