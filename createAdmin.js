const bcrypt = require('bcryptjs');
const { User, Tenant } = require('./src/Models');
const db = require('./src/Config/db');

async function createAdmin() {
  try {
    await db.authenticate();
    console.log('Database connected.');

    // Create a tenant if one doesn't exist
    let tenant = await Tenant.findOne();
    if (!tenant) {
      tenant = await Tenant.create({ Name: 'Default Tenant', Description: 'Auto-created tenant' });
      console.log('Created Default Tenant.');
    }

    // Check if admin user already exists
    let adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      console.log('Admin user already exists.');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        username: 'admin',
        password: hashedPassword,
        userrole: 'Admin',
        TenantID: tenant.TenantID,
        isActive: true
      });
      console.log('Admin user created successfully.');
    }

    console.log(`\n--- Admin Credentials ---`);
    console.log(`Username: admin`);
    console.log(`Password: admin123`);
    console.log(`TenantID: ${tenant.TenantID}`);
    console.log(`-------------------------\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
