import express from 'express';
import mysql from 'mysql'
import cors from 'cors'
const PORT = 5000;
import jwt from 'jsonwebtoken';


const app = express();
app.use(cors())
app.use(express.json())

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "credentials"
})

app.post('/signup', (req, res) => {
    const { username, email, password, employeeid, designation } = req.body;
    const INSERT_USER_QUERY = `INSERT INTO userinfo (username, email, password, employeeid, designation) VALUES (?, ?, ?, ?, ?)`;

    db.query(INSERT_USER_QUERY, [username, email, password, employeeid, designation], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error signing up');
        } else {
            res.status(200).send('User signed up successfully');
        }
    });
});

app.post('/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;
    const SELECT_USER_QUERY = `SELECT * FROM userinfo WHERE (username = ? OR email = ?) AND password = ?`;

    db.query(SELECT_USER_QUERY, [usernameOrEmail, usernameOrEmail, password], (err, results) => {
        if (err) {
            console.error('Error loggin', err);
            res.status(500).send('Error logging in');
        } else {
            if (results.length > 0) {
                // User found, login successful
                const user = results[0];
                const token = jwt.sign({userId: user.id}, 'your_secret_key')
                res.status(200).json({ token, email: user.email,role: user.role });
            } else {
                // User not found or invalid credentials
                res.status(401).send('Invalid username/email or password');
            }
        }
    });
});

app.post('/tasks', (req, res) => {
    const { title, description, dueDate } = req.body;
    const INSERT_TASK_QUERY = `INSERT INTO taskinfo (tasktitle, taskdescription, duedate) VALUES (?, ?, ?)`;

    db.query(INSERT_TASK_QUERY, [title, description, dueDate], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error adding task');
        } else {
            const newTask = { id: result.insertId, title, description, dueDate, completed: false };
            res.status(201).json({ newTask });
        }
    });
});

// Backend server code
app.get('/tasks', (req, res) => {
    // Fetch tasks from the database
    db.query('SELECT * FROM taskinfo', (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        } else {
            res.status(200).json({ tasks: results });
        }
    });
});

// Create a new endpoint fetch task from taskinfo table & Move task to completedtasks table & Delete task from taskinfo table
app.put('/tasks/:id/complete', (req, res) => {
    const taskId = req.params.id;

    // Fetch task from taskinfo table
    const SELECT_TASK_QUERY = `SELECT * FROM taskinfo WHERE id = ?`;
    db.query(SELECT_TASK_QUERY, [taskId], (err, results) => {
        if (err) {
            console.error('Error fetching task:', err);
            res.status(500).send('Error moving task to completed tasks');
        } else {
            if (results.length > 0) {
                const task = results[0];
                const { tasktitle, taskdescription, duedate } = task;

                // Move task to completedtasks table
                const INSERT_COMPLETED_TASK_QUERY = `INSERT INTO completedtasks (tasktitle, taskdescription, duedate) VALUES (?, ?, ?)`;
                db.query(INSERT_COMPLETED_TASK_QUERY, [tasktitle, taskdescription, duedate], (err, result) => {
                    if (err) {
                        console.error('Error moving task to completed tasks:', err);
                        res.status(500).send('Error moving task to completed tasks');
                    } else {
                        // Delete task from taskinfo table
                        const DELETE_TASK_QUERY = `DELETE FROM taskinfo WHERE id = ?`;
                        db.query(DELETE_TASK_QUERY, [taskId], (err, result) => {
                            if (err) {
                                console.error('Error deleting task:', err);
                                res.status(500).send('Error moving task to completed tasks');
                            } else {
                                res.status(200).send('Task moved to completed tasks successfully');
                            }
                        });
                    }
                });
            } else {
                res.status(404).send('Task not found');
            }
        }
    });
});

// Create a new endpoint for send completed tasks data to frontend
app.get('/completedtasks', (req, res) => {
    // Fetch completed tasks from the database
    db.query('SELECT * FROM completedtasks', (err, results) => {
        if (err) {
            console.error('Error fetching completed tasks:', err);
            res.status(500).json({ error: 'Failed to fetch completed tasks' });
        } else {
            res.status(200).json({ completedTasks: results });
        }
    });
});

//=======================================================================

// Backend
app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;

    const DELETE_TASK_QUERY = `DELETE FROM taskinfo WHERE id = ?`;
    db.query(DELETE_TASK_QUERY, [taskId], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            res.status(500).send('Error deleting task');
        } else {
            res.status(200).send('Task deleted successfully');
        }
    });
});

app.delete('/completedtasks/:id', (req, res) => {
    const taskId = req.params.id;

    const DELETE_COMPLETED_TASK_QUERY = `DELETE FROM completedtasks WHERE id = ?`;
    db.query(DELETE_COMPLETED_TASK_QUERY, [taskId], (err, result) => {
        if (err) {
            console.error('Error deleting completed task:', err);
            res.status(500).send('Error deleting completed task');
        } else {
            res.status(200).send('Completed task deleted successfully');
        }
    });
});






app.listen(PORT, () => {
    console.log(`App listening on port http://localhost:${PORT}`);
    db.connect((err) => {
        if (err) {
            console.error('Database connection error:', err);
        } else {
            console.log('Database connection successful');
        }
    });
});

