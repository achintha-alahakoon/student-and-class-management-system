const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const AuthRoutes = require('./Routes/AuthRoutes');
const StudentsListRoutes = require('./Routes/StudentsListRoutes');
const ParentsListRoutes = require('./Routes/ParentsListRoutes');
const TutorsListRoutes = require('./Routes/TutorsListRoutes');
const SubjectsListRoutes = require('./Routes/SubjectsListRoutes');
const ClassScheduleRoutes = require('./Routes/ClassScheduleRoutes');
const RegistrationRoutes = require('./Routes/RegistrationRoutes');
const PaymentRoutes = require('./Routes/PaymentRoutes');
const CountRoutes = require('./Routes/CountRoutes');
const AttendanceRoutes = require('./Routes/AttendanceRoutes');
const ClassesRoutes = require('./Routes/ClassesRoutes');
const StudentNameRoutes = require('./Routes/StudentNameRoutes');
const AssignmentRoutes = require('./Routes/AssignmentRoutes');
const GradesRoutes = require('./Routes/GradesRoutes');
const NotificationRoutes = require('./Routes/NotificationRoutes');
const AssignRoutes = require('./Routes/AssignRoutes');
const LectureMaterialRoutes = require('./Routes/LectureMaterialRoutes');

// Import models to register associations and sync DB
const { db } = require('./Models');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', AuthRoutes);
app.use('/api/students', StudentsListRoutes);
app.use('/api/parents', ParentsListRoutes);
app.use('/api/tutors', TutorsListRoutes);
app.use('/api/subjects', SubjectsListRoutes);
app.use('/api/classSchedule', ClassScheduleRoutes);
app.use('/api/registration', RegistrationRoutes);
app.use('/api/payment', PaymentRoutes);
app.use('/api/count', CountRoutes);
app.use('/api/attendance', AttendanceRoutes);
app.use('/api/classes', ClassesRoutes);
app.use('/api/name', StudentNameRoutes);
app.use('/api/assignment', AssignmentRoutes);
app.use('/api/grade', GradesRoutes);
app.use('/api/notification', NotificationRoutes);
app.use('/api/assign', AssignRoutes);
app.use('/api/lectureMaterial', LectureMaterialRoutes);

app.listen(8081, async () => {
    console.log('Server started on port 8081 successfully!');
    try {
        await db.sync({ force: false });
        console.log('All database tables synced successfully');
    } catch (err) {
        console.error('Error syncing database tables:', err.message);
    }
});

