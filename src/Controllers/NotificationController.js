const db = require("../Config/db");
const jwt = require("jsonwebtoken");

// send notification
exports.sendNotification = (req, res) => {
    const { recipientType, grade, subject, tutor, message } = req.body;
  
    const sender = "Admin";
    const currentDate = new Date();
    const date = currentDate.toISOString().split('T')[0];
    const time = currentDate.toTimeString().split(' ')[0];
  
    const query = 'INSERT INTO notification (Sender, Recipient_Type, Grade, Subject, Tutor, Date, Time, Content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(query, [sender, recipientType, grade, subject, tutor, date, time, message], (err, results) => {
      if (err) {
        console.error('Error saving notification:', err);
        return res.status(500).send('Error sending notification');
      }
      res.status(200).send('Notification sent successfully');
    });
  };



  // get all messages

exports.getMessages = (req, res) => {
    let token = req.headers['authorization'];
    let role = req.headers['role'];
    

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length); // Remove Bearer prefix
    }

    jwt.verify(token, 'secret_key', (err, decoded) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to authenticate token' });
        }

        const userID = decoded.UserID;

        if (role === 'Student') {
            handleStudentMessages(userID, res);
        } else if (role === 'Tutor') {
            handleTutorMessages(userID, res);
        } else if (role === 'Parent') {
            handleParentMessages(userID, res);
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }
    });
};


function handleStudentMessages(userID, res) {
    const notificationQuery = `
        SELECT NotificationID, Sender, Recipient_Type, Grade, Subject, Tutor, Date, Time, Content 
        FROM notification 
        WHERE Recipient_Type IN ('Student', 'allStudents') 
        ORDER BY Date DESC, Time DESC
    `;

    db.query(notificationQuery, (err, notifications) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).json({ error: 'Error fetching notifications' });
        }
        
        if (notifications.length === 0) {
            return res.status(200).json([]);
        }

        const uniqueClassDetails = [...new Set(notifications.map(n => `${n.Grade},${n.Subject},${n.Tutor}`))];
        const classDetails = uniqueClassDetails.map(details => details.split(','));

        const classQuery = `
            SELECT ClassID, Grade, Subject, Tutor 
            FROM class 
            WHERE (Grade, Subject, Tutor) IN (?)
        `;

        db.query(classQuery, [classDetails], (err, classes) => {
            if (err) {
                console.error('Error fetching classes:', err);
                return res.status(500).json({ error: 'Error fetching classes' });
            }

            if (classes.length === 0) {
                return res.status(200).json([]);
            }

            const classIDs = classes.map(c => c.ClassID);
            const enrolledQuery = `
                SELECT UserID 
                FROM enrolledclasses 
                WHERE ClassID IN (?)
            `;

            db.query(enrolledQuery, [classIDs], (err, enrolledUsers) => {
                if (err) {
                    console.error('Error fetching enrolled users:', err);
                    return res.status(500).json({ error: 'Error fetching enrolled users' });
                }

                const userIDs = enrolledUsers.map(e => e.UserID);
                if (!userIDs.includes(userID)) {
                    return res.status(403).json({ error: 'Access denied' });
                }

                const userNotifications = notifications.filter(notification => {
                    const classInfo = classes.find(c => 
                        c.Grade === notification.Grade && 
                        c.Subject === notification.Subject && 
                        c.Tutor === notification.Tutor
                    );
                    return classInfo;
                });

                const allStudentsNotifications = notifications.filter(notification => 
                    notification.Recipient_Type === 'allStudents'
                );

                const combinedNotifications = [...userNotifications, ...allStudentsNotifications];

                // Sort combinedNotifications by Date and Time
                combinedNotifications.sort((a, b) => {
                    const dateA = new Date(`${a.Date}T${a.Time}`);
                    const dateB = new Date(`${b.Date}T${b.Time}`);
                    return dateB - dateA; // Sort descending
                });

                const userNotificationsWithStatus = combinedNotifications.map(n => ({
                    messageId: n.NotificationID,
                    Sender: n.Sender,
                    Date: n.Date,
                    Time: n.Time,
                    Content: n.Content
                }));

                const readStatusQuery = `
                    SELECT messageID, isRead
                    FROM usermessagereadstatus
                    WHERE userID = ?
                `;

                db.query(readStatusQuery, [userID], (err, readStatuses) => {
                    if (err) {
                        console.error('Error fetching read statuses:', err);
                        return res.status(500).json({ error: 'Error fetching read statuses' });
                    }

                    const readStatusMap = {};
                    readStatuses.forEach(status => {
                        readStatusMap[status.messageID] = status.isRead;
                    });

                    const messagesWithReadStatus = userNotificationsWithStatus.map(msg => ({
                        ...msg,
                        unread: !(msg.messageId in readStatusMap && readStatusMap[msg.messageId])
                    }));

                    res.status(200).json(messagesWithReadStatus);
                });
            });
        });
    });
}



function handleTutorMessages(userID, res) {
    const notificationQuery = `
        SELECT NotificationID, Sender, Recipient_Type, Grade, Subject, Tutor, Date, Time, Content 
        FROM notification 
        WHERE Recipient_Type IN ('Tutor', 'allTutors') 
        ORDER BY Date DESC, Time DESC
    `;
 
    db.query(notificationQuery, (err, notifications) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).json({ error: 'Error fetching notifications' });
        }

        const tutorQuery = `
            SELECT FirstName, LastName 
            FROM tutor 
            WHERE UserID = ?
        `;

        db.query(tutorQuery, [userID], (err, tutors) => {
            if (err) {
                console.error('Error fetching tutor information:', err);
                return res.status(500).json({ error: 'Error fetching tutor information' });
            }

            if (tutors.length === 0) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const name = `${tutors[0].FirstName} ${tutors[0].LastName}`;

            const userNotifications = notifications.filter(notification => {
                return notification.Tutor === name || notification.Recipient_Type === 'allTutors';
            });

            const userNotificationsWithStatus = userNotifications.map(n => ({
                messageId: n.NotificationID,
                Sender: n.Sender,
                Date: n.Date,
                Time: n.Time,
                Content: n.Content
            }));

            const readStatusQuery = `
                SELECT messageID, isRead
                FROM usermessagereadstatus
                WHERE userID = ?
            `;

            db.query(readStatusQuery, [userID], (err, readStatuses) => {
                if (err) {
                    console.error('Error fetching read statuses:', err);
                    return res.status(500).json({ error: 'Error fetching read statuses' });
                }

                const readStatusMap = {};
                readStatuses.forEach(status => {
                    readStatusMap[status.messageID] = status.isRead;
                });

                const messagesWithReadStatus = userNotificationsWithStatus.map(msg => ({
                    ...msg,
                    unread: !(msg.messageId in readStatusMap && readStatusMap[msg.messageId])
                }));

                res.status(200).json(messagesWithReadStatus);
            });
        });
    });
}



function handleParentMessages(userID, res) {
    const notificationQuery = `
        SELECT NotificationID, Sender, Recipient_Type, Grade, Subject, Tutor, Date, Time, Content 
        FROM notification 
        WHERE Recipient_Type IN ('Parent', 'allParents') 
        ORDER BY Date DESC, Time DESC
    `;

    db.query(notificationQuery, (err, notifications) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).json({ error: 'Error fetching notifications' });
        }

        if (notifications.length === 0) {
            return res.status(200).json([]);
        }

        const uniqueClassDetails = [...new Set(notifications.map(n => `${n.Grade},${n.Subject},${n.Tutor}`))];
        const classDetails = uniqueClassDetails.map(details => details.split(','));

        const classQuery = `
            SELECT ClassID, Grade, Subject, Tutor 
            FROM class 
            WHERE (Grade, Subject, Tutor) IN (?)
        `;

        db.query(classQuery, [classDetails], (err, classes) => {
            if (err) {
                console.error('Error fetching classes:', err);
                return res.status(500).json({ error: 'Error fetching classes' });
            }

            if (classes.length === 0) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const classIDs = classes.map(c => c.ClassID);
            const enrolledQuery = `
                SELECT UserID, ClassID 
                FROM enrolledclasses 
                WHERE ClassID IN (?)
            `;

            db.query(enrolledQuery, [classIDs], (err, enrolledClasses) => {
                if (err) {
                    console.error('Error fetching enrolled users:', err);
                    return res.status(500).json({ error: 'Error fetching enrolled users' });
                }

                const userIDs = enrolledClasses.map(e => e.UserID);
                const studentQuery = `
                    SELECT StudentID 
                    FROM student 
                    WHERE UserID IN (?)
                `;

                db.query(studentQuery, [userIDs], (err, students) => {
                    if (err) {
                        console.error('Error fetching student information:', err);
                        return res.status(500).json({ error: 'Error fetching student information' });
                    }

                    const studentIDs = students.map(s => s.StudentID);
                    if (studentIDs.length === 0) {
                        return res.status(403).json({ error: 'No students found' });
                    }

                    const parentQuery = `
                        SELECT UserID 
                        FROM parent 
                        WHERE StudentNo IN (?)
                    `;

                    db.query(parentQuery, [studentIDs], (err, parents) => {
                        if (err) {
                            console.error('Error fetching parent information:', err);
                            return res.status(500).json({ error: 'Error fetching parent information' });
                        }

                        const parentUserIDs = parents.map(p => p.UserID);

                        if (!parentUserIDs.includes(userID)) {
                            return res.status(403).json({ error: 'Access denied' });
                        }

                        // Filter notifications related to their students and for all parents
                        const userNotifications = notifications.filter(notification => {
                            const classInfo = classes.find(c => 
                                c.Grade === notification.Grade && 
                                c.Subject === notification.Subject && 
                                c.Tutor === notification.Tutor
                            );
                            return classInfo || notification.Recipient_Type === 'allParents';
                        });

                        const userNotificationsWithStatus = userNotifications.map(n => ({
                            messageId: n.NotificationID,
                            Sender: n.Sender,
                            Date: n.Date,
                            Time: n.Time,
                            Content: n.Content
                        }));

                        const readStatusQuery = `
                            SELECT messageID, isRead 
                            FROM usermessagereadstatus 
                            WHERE userID = ?
                        `;

                        db.query(readStatusQuery, [userID], (err, readStatuses) => {
                            if (err) {
                                console.error('Error fetching read statuses:', err);
                                return res.status(500).json({ error: 'Error fetching read statuses' });
                            }

                            const readStatusMap = {};
                            readStatuses.forEach(status => {
                                readStatusMap[status.messageID] = status.isRead;
                            });

                            const messagesWithReadStatus = userNotificationsWithStatus.map(msg => ({
                                ...msg,
                                unread: !(msg.messageId in readStatusMap && readStatusMap[msg.messageId])
                            }));

                            res.status(200).json(messagesWithReadStatus);
                        });
                    });
                });
            });
        });
    });
}











// read unread status

exports.updateMessageStatus = (req, res) => {
    let token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length); // Remove Bearer prefix
    }

    jwt.verify(token, 'secret_key', (err, decoded) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to authenticate token' });
        }

        const userID = decoded.UserID;
        const { messageId } = req.body;

        const query = `
            INSERT INTO usermessagereadstatus (userID, messageID, isRead)
            VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE isRead = 1
        `;

        db.query(query, [userID, messageId], (err, results) => {
            if (err) {
                console.error('Error updating message status:', err);
                return res.status(500).send('Error updating message status');
            }
            res.status(200).send('Message status updated successfully');
        });
    });
};

