const { Notification, Class, EnrolledClass, Student, Parent, Tutor, UserMessageReadStatus } = require("../Models");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");

// send notification
exports.sendNotification = async (req, res) => {
  const { recipientType, grade, subject, tutor, message } = req.body;

  const sender = "Admin";
  const currentDate = new Date();
  const date = currentDate.toISOString().split('T')[0];
  const time = currentDate.toTimeString().split(' ')[0];

  try {
    await Notification.create({
      Sender: sender,
      Recipient_Type: recipientType,
      Grade: grade,
      Subject: subject,
      Tutor: tutor,
      Date: date,
      Time: time,
      Content: message
    });
    res.status(200).send('Notification sent successfully');
  } catch (err) {
    console.error('Error saving notification:', err);
    res.status(500).send('Error sending notification');
  }
};

// get all messages
exports.getMessages = (req, res) => {
  let token = req.headers['authorization'];
  let role = req.headers['role'];

  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

    const userID = decoded.UserID;

    try {
      if (role === 'Student') {
        await handleStudentMessages(userID, res);
      } else if (role === 'Tutor') {
        await handleTutorMessages(userID, res);
      } else if (role === 'Parent') {
        await handleParentMessages(userID, res);
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Error fetching messages' });
    }
  });
};

async function handleStudentMessages(userID, res) {
  const notifications = await Notification.findAll({
    where: { Recipient_Type: { [Op.in]: ['Student', 'allStudents'] } },
    order: [['Date', 'DESC'], ['Time', 'DESC']]
  });

  if (notifications.length === 0) return res.status(200).json([]);

  const classes = await Class.findAll({
    attributes: ['ClassID', 'Grade', 'Subject', 'Tutor']
  });

  const classIDs = classes.map(c => c.ClassID);
  const enrolledUsers = await EnrolledClass.findAll({ where: { ClassID: classIDs } });
  const userIDs = enrolledUsers.map(e => e.UserID);

  if (!userIDs.includes(userID)) return res.status(403).json({ error: 'Access denied' });

  const userNotifications = notifications.filter(n => {
    const classInfo = classes.find(c =>
      c.Grade === n.Grade && c.Subject === n.Subject && c.Tutor === n.Tutor
    );
    return classInfo;
  });

  const allStudentsNotifications = notifications.filter(n => n.Recipient_Type === 'allStudents');
  const combinedNotifications = [...userNotifications, ...allStudentsNotifications];

  combinedNotifications.sort((a, b) => {
    const dateA = new Date(`${a.Date}T${a.Time}`);
    const dateB = new Date(`${b.Date}T${b.Time}`);
    return dateB - dateA;
  });

  const userNotificationsWithStatus = combinedNotifications.map(n => ({
    messageId: n.NotificationID,
    Sender: n.Sender,
    Date: n.Date,
    Time: n.Time,
    Content: n.Content
  }));

  const readStatuses = await UserMessageReadStatus.findAll({ where: { userID: userID } });

  const readStatusMap = {};
  readStatuses.forEach(status => {
    readStatusMap[status.messageID] = status.isRead;
  });

  const messagesWithReadStatus = userNotificationsWithStatus.map(msg => ({
    ...msg,
    unread: !(msg.messageId in readStatusMap && readStatusMap[msg.messageId])
  }));

  res.status(200).json(messagesWithReadStatus);
}

async function handleTutorMessages(userID, res) {
  const notifications = await Notification.findAll({
    where: { Recipient_Type: { [Op.in]: ['Tutor', 'allTutors'] } },
    order: [['Date', 'DESC'], ['Time', 'DESC']]
  });

  const tutor = await Tutor.findOne({ where: { UserID: userID } });
  if (!tutor) return res.status(403).json({ error: 'Access denied' });

  const name = `${tutor.FirstName} ${tutor.LastName}`;

  const userNotifications = notifications.filter(n =>
    n.Tutor === name || n.Recipient_Type === 'allTutors'
  );

  const userNotificationsWithStatus = userNotifications.map(n => ({
    messageId: n.NotificationID,
    Sender: n.Sender,
    Date: n.Date,
    Time: n.Time,
    Content: n.Content
  }));

  const readStatuses = await UserMessageReadStatus.findAll({ where: { userID: userID } });

  const readStatusMap = {};
  readStatuses.forEach(status => {
    readStatusMap[status.messageID] = status.isRead;
  });

  const messagesWithReadStatus = userNotificationsWithStatus.map(msg => ({
    ...msg,
    unread: !(msg.messageId in readStatusMap && readStatusMap[msg.messageId])
  }));

  res.status(200).json(messagesWithReadStatus);
}

async function handleParentMessages(userID, res) {
  const notifications = await Notification.findAll({
    where: { Recipient_Type: { [Op.in]: ['Parent', 'allParents'] } },
    order: [['Date', 'DESC'], ['Time', 'DESC']]
  });

  if (notifications.length === 0) return res.status(200).json([]);

  const classes = await Class.findAll({
    attributes: ['ClassID', 'Grade', 'Subject', 'Tutor']
  });

  const classIDs = classes.map(c => c.ClassID);
  const enrolledClasses = await EnrolledClass.findAll({ where: { ClassID: classIDs } });
  const userIDs = enrolledClasses.map(e => e.UserID);

  const students = await Student.findAll({ where: { UserID: userIDs }, attributes: ['StudentID'] });
  const studentIDs = students.map(s => s.StudentID);

  if (studentIDs.length === 0) return res.status(403).json({ error: 'No students found' });

  const parents = await Parent.findAll({ where: { StudentNo: studentIDs }, attributes: ['UserID'] });
  const parentUserIDs = parents.map(p => p.UserID);

  if (!parentUserIDs.includes(userID)) return res.status(403).json({ error: 'Access denied' });

  const userNotifications = notifications.filter(n => {
    const classInfo = classes.find(c =>
      c.Grade === n.Grade && c.Subject === n.Subject && c.Tutor === n.Tutor
    );
    return classInfo || n.Recipient_Type === 'allParents';
  });

  const userNotificationsWithStatus = userNotifications.map(n => ({
    messageId: n.NotificationID,
    Sender: n.Sender,
    Date: n.Date,
    Time: n.Time,
    Content: n.Content
  }));

  const readStatuses = await UserMessageReadStatus.findAll({ where: { userID: userID } });

  const readStatusMap = {};
  readStatuses.forEach(status => {
    readStatusMap[status.messageID] = status.isRead;
  });

  const messagesWithReadStatus = userNotificationsWithStatus.map(msg => ({
    ...msg,
    unread: !(msg.messageId in readStatusMap && readStatusMap[msg.messageId])
  }));

  res.status(200).json(messagesWithReadStatus);
}

// read/unread status
exports.updateMessageStatus = (req, res) => {
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

    const userID = decoded.UserID;
    const { messageId } = req.body;

    try {
      await UserMessageReadStatus.upsert({ userID: userID, messageID: messageId, isRead: 1 });
      res.status(200).send('Message status updated successfully');
    } catch (error) {
      console.error('Error updating message status:', error);
      res.status(500).send('Error updating message status');
    }
  });
};
