const path = require('path');
const dotenv = require('dotenv');

// Load env before importing models because the Sequelize instance reads process.env.
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, Doctor } = require('./models');

const doctorsSeedData = [
  { name: 'Dr. Rajesh Sharma', category: 'General Physician' },
  { name: 'Dr. Priya Mehta', category: 'Cardiology' },
  { name: 'Dr. Amit Patel', category: 'Orthopedics' },
  { name: 'Dr. Sneha Rao', category: 'Pediatrics' },
  { name: 'Dr. Vikram Deshmukh', category: 'Dermatology' },
  { name: 'Dr. Ananya Gupta', category: 'Gynecology' }
];

const seedDatabase = async () => {
  const fresh = process.argv.includes('--fresh');

  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL for seeding...');
    await sequelize.sync();

    if (fresh) {
      console.warn('--fresh: clearing doctors. CASCADE also removes appointments and consultations.');
      await Doctor.destroy({ truncate: true, cascade: true });
      console.log('Cleared existing doctors table.');
    }

    let created = 0;
    for (const data of doctorsSeedData) {
      const [, wasCreated] = await Doctor.findOrCreate({ where: data });
      if (wasCreated) created += 1;
    }

    console.log(`Seeding completed. ${created} new doctor(s) added.`);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    try {
      await sequelize.close();
    } catch (_) {
      // Ignore errors while closing after a failed seed.
    }
    process.exit(1);
  }
};

seedDatabase();
