const db = require('../Config/db');

const User = require('./User');
const Student = require('./Student');
const Parent = require('./Parent');
const Tutor = require('./Tutor');
const Class = require('./Class');
const EnrolledClass = require('./EnrolledClass');
const ClassSchedule = require('./ClassSchedule');
const Payment = require('./Payment');
const Attendance = require('./Attendance');
const Grade = require('./Grade');
const AssignmentType = require('./AssignmentType');
const Assignment = require('./Assignment');
const Notification = require('./Notification');
const ParentChild = require('./ParentChild');
const UserMessageReadStatus = require('./UserMessageReadStatus');
const Tenant = require('./Tenant');

// Define Associations

// User associations
User.hasOne(Student, { foreignKey: 'UserID' });
Student.belongsTo(User, { foreignKey: 'UserID' });

User.hasOne(Parent, { foreignKey: 'UserID' });
Parent.belongsTo(User, { foreignKey: 'UserID' });

User.hasOne(Tutor, { foreignKey: 'UserID' });
Tutor.belongsTo(User, { foreignKey: 'UserID' });

// Tenant associations
Tenant.hasMany(User, { foreignKey: 'TenantID' });
User.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(Student, { foreignKey: 'TenantID' });
Student.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(Parent, { foreignKey: 'TenantID' });
Parent.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(Tutor, { foreignKey: 'TenantID' });
Tutor.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(Class, { foreignKey: 'TenantID' });
Class.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(EnrolledClass, { foreignKey: 'TenantID' });
EnrolledClass.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(ClassSchedule, { foreignKey: 'TenantID' });
ClassSchedule.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(Payment, { foreignKey: 'TenantID' });
Payment.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(Attendance, { foreignKey: 'TenantID' });
Attendance.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(Grade, { foreignKey: 'TenantID' });
Grade.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(Assignment, { foreignKey: 'TenantID' });
Assignment.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(Notification, { foreignKey: 'TenantID' });
Notification.belongsTo(Tenant, { foreignKey: 'TenantID' });

Tenant.hasMany(ParentChild, { foreignKey: 'TenantID' });
ParentChild.belongsTo(Tenant, { foreignKey: 'TenantID' });

User.hasMany(EnrolledClass, { foreignKey: 'UserID' });
EnrolledClass.belongsTo(User, { foreignKey: 'UserID' });

User.hasMany(UserMessageReadStatus, { foreignKey: 'userID' });
UserMessageReadStatus.belongsTo(User, { foreignKey: 'userID' });

// Tutor associations
Tutor.hasMany(Class, { foreignKey: 'TutorID' });
Class.belongsTo(Tutor, { foreignKey: 'TutorID' });

// Class associations
Class.hasMany(EnrolledClass, { foreignKey: 'ClassID' });
EnrolledClass.belongsTo(Class, { foreignKey: 'ClassID' });

Class.hasMany(ClassSchedule, { foreignKey: 'ClassID' });
ClassSchedule.belongsTo(Class, { foreignKey: 'ClassID' });

Class.hasMany(Payment, { foreignKey: 'ClassID' });
Payment.belongsTo(Class, { foreignKey: 'ClassID' });

Class.hasMany(Assignment, { foreignKey: 'ClassID' });
Assignment.belongsTo(Class, { foreignKey: 'ClassID' });

// EnrolledClass associations
EnrolledClass.hasMany(Attendance, { foreignKey: 'enrolledclassID' });
Attendance.belongsTo(EnrolledClass, { foreignKey: 'enrolledclassID' });

// Student associations
Student.hasMany(Payment, { foreignKey: 'StudentID' });
Payment.belongsTo(Student, { foreignKey: 'StudentID' });

Student.hasMany(Grade, { foreignKey: 'StudentID' });
Grade.belongsTo(Student, { foreignKey: 'StudentID' });

Student.hasMany(ParentChild, { foreignKey: 'StudentID' });
ParentChild.belongsTo(Student, { foreignKey: 'StudentID' });

// Parent associations
Parent.hasMany(ParentChild, { foreignKey: 'ParentID' });
ParentChild.belongsTo(Parent, { foreignKey: 'ParentID' });

// Assignment associations
Assignment.hasMany(Grade, { foreignKey: 'AssignmentsID' });
Grade.belongsTo(Assignment, { foreignKey: 'AssignmentsID' });

AssignmentType.hasMany(Assignment, { foreignKey: 'assignment_type_id' });
Assignment.belongsTo(AssignmentType, { foreignKey: 'assignment_type_id' });

// Notification associations
Notification.hasMany(UserMessageReadStatus, { foreignKey: 'messageID' });
UserMessageReadStatus.belongsTo(Notification, { foreignKey: 'messageID' });

module.exports = {
  db,
  User,
  Student,
  Parent,
  Tutor,
  Class,
  EnrolledClass,
  ClassSchedule,
  Payment,
  Attendance,
  Grade,
  AssignmentType,
  Assignment,
  Notification,
  ParentChild,
  UserMessageReadStatus,
  Tenant
};
