const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');

const seedDemoData = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_exam_portal';

  try {
    console.log('[Seed Demo] Connecting to MongoDB...');
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed Demo] Connected.');

    const salt = await bcrypt.genSalt(10);

    // 1. Seed Teacher
    const teacherPasswordHash = await bcrypt.hash('Teacher@12345', salt);
    let teacher = await User.findOneAndUpdate(
      { email: 'teacher@examportal.edu' },
      {
        name: 'Dr. Jane Hopper',
        email: 'teacher@examportal.edu',
        passwordHash: teacherPasswordHash,
        role: 'teacher'
      },
      { upsert: true, new: true }
    );

    // 2. Seed Students
    const studentPasswordHash = await bcrypt.hash('Student@12345', salt);
    await User.findOneAndUpdate(
      { email: 'alice@student.edu' },
      {
        name: 'Alice Smith',
        email: 'alice@student.edu',
        passwordHash: studentPasswordHash,
        role: 'student'
      },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { email: 'bob@student.edu' },
      {
        name: 'Bob Johnson',
        email: 'bob@student.edu',
        passwordHash: studentPasswordHash,
        role: 'student'
      },
      { upsert: true, new: true }
    );

    // 3. Seed Exam 1: Data Structures & Algorithms
    let exam1 = await Exam.findOneAndUpdate(
      { title: 'Data Structures & Algorithms Certification Exam' },
      {
        title: 'Data Structures & Algorithms Certification Exam',
        description: 'Comprehensive assessment on arrays, linked lists, trees, complexity analysis, and recursion.',
        instructions: '1. You have 20 minutes to complete 5 questions.\n2. Each question carries 2 marks.\n3. There is no negative marking.\n4. Click Submit once finished or it will auto-submit when the timer expires.',
        durationMinutes: 20,
        createdBy: teacher._id,
        status: 'published',
        maxAttempts: 3,
        allowAnswerReview: true
      },
      { upsert: true, new: true }
    );

    // Questions for Exam 1
    await Question.deleteMany({ examId: exam1._id });
    await Question.insertMany([
      {
        examId: exam1._id,
        questionText: 'What is the time complexity of searching for an element in a balanced Binary Search Tree (AVL / Red-Black Tree)?',
        options: [
          { id: 'opt_1', text: 'O(1)' },
          { id: 'opt_2', text: 'O(log N)' },
          { id: 'opt_3', text: 'O(N)' },
          { id: 'opt_4', text: 'O(N log N)' }
        ],
        correctAnswer: 'opt_2',
        marks: 2,
        order: 1,
        topic: 'Trees',
        explanation: 'In a balanced binary search tree with N nodes, the height is bounded by O(log N). Thus search requires O(log N) operations.'
      },
      {
        examId: exam1._id,
        questionText: 'Which data structure follows the Last In, First Out (LIFO) principle?',
        options: [
          { id: 'opt_1', text: 'Queue' },
          { id: 'opt_2', text: 'Stack' },
          { id: 'opt_3', text: 'Array' },
          { id: 'opt_4', text: 'Priority Queue' }
        ],
        correctAnswer: 'opt_2',
        marks: 2,
        order: 2,
        topic: 'Stacks',
        explanation: 'A Stack strictly operates on the LIFO order where the most recently inserted item is removed first.'
      },
      {
        examId: exam1._id,
        questionText: 'What is the worst-case time complexity of QuickSort when a naive pivot selection (e.g. always first element) is used on an already sorted array?',
        options: [
          { id: 'opt_1', text: 'O(log N)' },
          { id: 'opt_2', text: 'O(N)' },
          { id: 'opt_3', text: 'O(N log N)' },
          { id: 'opt_4', text: 'O(N^2)' }
        ],
        correctAnswer: 'opt_4',
        marks: 2,
        order: 3,
        topic: 'Sorting',
        explanation: 'In unbalanced partitions (such as sorted arrays with the first element as pivot), QuickSort degrades to O(N^2).'
      },
      {
        examId: exam1._id,
        questionText: 'Which algorithm is guaranteed to find the shortest path in a weighted graph with non-negative edge weights?',
        options: [
          { id: 'opt_1', text: "Dijkstra's Algorithm" },
          { id: 'opt_2', text: "Kruskal's Algorithm" },
          { id: 'opt_3', text: "Prim's Algorithm" },
          { id: 'opt_4', text: 'Depth-First Search (DFS)' }
        ],
        correctAnswer: 'opt_1',
        marks: 2,
        order: 4,
        topic: 'Graphs',
        explanation: "Dijkstra's greedy shortest path algorithm computes the shortest path tree for non-negative edge weights."
      },
      {
        examId: exam1._id,
        questionText: 'Which of the following is true regarding Hash Tables with chaining?',
        options: [
          { id: 'opt_1', text: 'Searching always takes O(1) in the worst case' },
          { id: 'opt_2', text: 'Collisions are resolved by inserting elements into a linked list at the bucket index' },
          { id: 'opt_3', text: 'The size of the hash table must always equal the number of keys' },
          { id: 'opt_4', text: 'Hash tables cannot store string keys' }
        ],
        correctAnswer: 'opt_2',
        marks: 2,
        order: 5,
        topic: 'Hashing',
        explanation: 'Chaining handles hash collisions by chaining records into a linked list or dynamic list attached to each bucket.'
      }
    ]);

    // 4. Seed Exam 2: Full-Stack Web Development & JavaScript
    let exam2 = await Exam.findOneAndUpdate(
      { title: 'Full-Stack JavaScript & Modern Web Technologies' },
      {
        title: 'Full-Stack JavaScript & Modern Web Technologies',
        description: 'Quiz testing core concepts in JavaScript ES6+, asynchronous programming, Node.js, and React architecture.',
        instructions: '1. Duration: 15 minutes.\n2. Total Questions: 5 (2 marks each).\n3. Answers are saved dynamically as you select them.',
        durationMinutes: 15,
        createdBy: teacher._id,
        status: 'published',
        maxAttempts: 2,
        allowAnswerReview: true
      },
      { upsert: true, new: true }
    );

    await Question.deleteMany({ examId: exam2._id });
    await Question.insertMany([
      {
        examId: exam2._id,
        questionText: 'What is the role of the Event Loop in Node.js?',
        options: [
          { id: 'opt_1', text: 'To compile JavaScript into machine code' },
          { id: 'opt_2', text: 'To offload non-blocking I/O operations and coordinate callback execution' },
          { id: 'opt_3', text: 'To encrypt HTTPS network traffic' },
          { id: 'opt_4', text: 'To manage database schema migrations' }
        ],
        correctAnswer: 'opt_2',
        marks: 2,
        order: 1,
        topic: 'Node.js',
        explanation: 'Node.js event loop coordinates asynchronous non-blocking I/O tasks using libuv.'
      },
      {
        examId: exam2._id,
        questionText: 'In React, what is the main purpose of the Virtual DOM?',
        options: [
          { id: 'opt_1', text: 'Directly manipulate the native browser DOM for all changes' },
          { id: 'opt_2', text: 'Compute minimal DOM updates using reconciliation diffing' },
          { id: 'opt_3', text: 'Act as a secure database inside the browser' },
          { id: 'opt_4', text: 'Replace JavaScript with WebAssembly' }
        ],
        correctAnswer: 'opt_2',
        marks: 2,
        order: 2,
        topic: 'React',
        explanation: 'React compares the Virtual DOM tree against previous states and batches minimal mutations to the real DOM.'
      },
      {
        examId: exam2._id,
        questionText: 'Which HTTP status code signifies that a client must authenticate before gaining access?',
        options: [
          { id: 'opt_1', text: '200 OK' },
          { id: 'opt_2', text: '401 Unauthorized' },
          { id: 'opt_3', text: '403 Forbidden' },
          { id: 'opt_4', text: '404 Not Found' }
        ],
        correctAnswer: 'opt_2',
        marks: 2,
        order: 3,
        topic: 'HTTP & REST',
        explanation: 'HTTP 401 indicates that the request requires user authentication credentials.'
      },
      {
        examId: exam2._id,
        questionText: 'What does a JavaScript closure preserve?',
        options: [
          { id: 'opt_1', text: 'Access to outer lexical scope variables even after outer function executes' },
          { id: 'opt_2', text: 'Only global variables' },
          { id: 'opt_3', text: 'Only DOM nodes' },
          { id: 'opt_4', text: 'Database transactions' }
        ],
        correctAnswer: 'opt_1',
        marks: 2,
        order: 4,
        topic: 'JavaScript',
        explanation: 'A closure is the combination of a function bundled together with references to its surrounding lexical environment.'
      },
      {
        examId: exam2._id,
        questionText: 'Why should passwords NEVER be stored in plain text in a MongoDB database?',
        options: [
          { id: 'opt_1', text: 'Plain text passwords crash the BSON parser' },
          { id: 'opt_2', text: 'Plain text exposes user credentials in the event of a database compromise; slow cryptographic hashing (e.g. bcrypt) protects them' },
          { id: 'opt_3', text: 'MongoDB only supports integers for passwords' },
          { id: 'opt_4', text: 'Plain text passwords violate CORS policies' }
        ],
        correctAnswer: 'opt_2',
        marks: 2,
        order: 5,
        topic: 'Security',
        explanation: 'Passwords must be salted and hashed with adaptive algorithms like bcrypt to resist rainbow-table and brute-force attacks.'
      }
    ]);

    // 5. Seed Exam 3: Draft Exam
    let exam3 = await Exam.findOneAndUpdate(
      { title: 'Database Design & SQL Optimization (Draft)' },
      {
        title: 'Database Design & SQL Optimization (Draft)',
        description: 'Advanced topics in ACID transactions, normalization, B-tree indexes, and query execution plans.',
        instructions: 'Draft exam in preparation by instructor.',
        durationMinutes: 30,
        createdBy: teacher._id,
        status: 'draft',
        maxAttempts: 1,
        allowAnswerReview: false
      },
      { upsert: true, new: true }
    );

    console.log('[Seed Demo] Demo data successfully seeded!');
    console.log('  Teacher:  teacher@examportal.edu / Teacher@12345');
    console.log('  Student 1: alice@student.edu / Student@12345');
    console.log('  Student 2: bob@student.edu / Student@12345');
    console.log(`  Exams Created: "${exam1.title}" (published), "${exam2.title}" (published), "${exam3.title}" (draft)`);
  } catch (error) {
    console.error('[Seed Demo Error]:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedDemoData();
