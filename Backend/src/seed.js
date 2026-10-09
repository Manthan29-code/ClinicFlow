const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const Doctor = require('./models/Doctor');

// Load environment variables from .env if present
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const doctorsSeedData = [
  { name: 'Dr. Rajesh Sharma', category: 'General Physician' },
  { name: 'Dr. Priya Mehta', category: 'Cardiology' },
  { name: 'Dr. Amit Patel', category: 'Orthopedics' },
  { name: 'Dr. Sneha Rao', category: 'Pediatrics' },
  { name: 'Dr. Vikram Deshmukh', category: 'Dermatology' },
  { name: 'Dr. Ananya Gupta', category: 'Gynecology' }
];

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/opd_mini';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing doctors
    await Doctor.deleteMany();
    console.log('Cleared existing doctors collection.');

    // Insert initial doctors
    const createdDoctors = await Doctor.insertMany(doctorsSeedData);
    console.log(`Successfully seeded ${createdDoctors.length} doctors:`);
    createdDoctors.forEach((doc) => {
      console.log(` - ${doc.name} (${doc.category})`);
    });

    console.log('Seeding completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedDatabase();
