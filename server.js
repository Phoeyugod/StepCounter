require('dotenv').config();
const express = require('express');
var cors = require('cors')
const mysql = require('mysql');
var sha1 = require('sha1');

const app = express();
const port = process.env.APP_PORT 
const pwdRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// HARDCODED sensitive data
var pool = mysql.createPool({
    connectionLimit: process.env.CONN_LIMIT,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    multipleStatements: process.env.DB_MULTI_QUERY,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    timezone: process.env.DB_TIMEZONE 
});
//Middleware
app.use(cors())
app.use(express.urlencoded({extended: true}))
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the StepCounter API!')
})

// USERS ENDPOINTS -------------------

// registration

app.post('/users/register', (req, res) => {
    const {name, email, passwd, confirm} = req.body;

    if(!name || !email || !passwd || !confirm){
        return res.status(400).json({error: 'Missing required fields'});
    }   

    if(passwd !== confirm){
        return res.status(400).json({error: 'Password do not match'});
    }

    //TODO: check password strength (with regular expenssion)
    if (!passwd.match(pwdRegExp)){
        return res.status(400).json({error: 'Password is not strong enough'});
    }
       

    pool.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error){
            return res.status(500).json({error: 'Database query error'});
        }

        if(results.length > 0){
            return res.status(400).json({error: 'This e-mail already exists '})
        }

        pool.query('INSERT INTO users (name, email, passwd, role) VALUES (?,?,SHA1(?), "user")', [name, email, passwd], (error, results) => {
            if(error){
                return res.status(500).json({error: 'Database insert error'});
            }

           return res.status(200).json({ message: 'User registered successfully!'});
        });
        
    });
});

// login

app.post('/users/login', (req,res) => {
    const {email, passwd} = req.body;

    // VALIDATION

    // Check for missing fields
    if(!email || !passwd){
        return res.status(400).json({error: 'Missing required fields'});
    }

    // check email and password exists
    pool.query('SELECT * FROM users WHERE email=? AND passwd=SHA1(?)', [email, passwd], (error, results) => {
        if(error){
            return res.status(500).json({error:'Database query error'});
        }
        
        // if don't exists user with this email and password
        if(results.length == 0){
            return res.status(400).json({error:'Invalid credentials'});
        }

        if(results[0].is_active == 0){
            return res.status(400).json({error: 'This user is banned by admin!'})
        }

        //TODO: check user is_active?   
        const loggedUser = {
            ID: results[0].ID,
            name: results[0].name,
            email: results[0].email,
            role: results[0].role
        };
        pool.query('UPDATE users SET last_login=CURRENT_TIMESTAMP, login_count=login_count+1  WHERE ID=?', [results[0].ID], (error, results) => {
            if(error){
                return res.status(500).json({error: 'Database query error'})
            }   
            //TODO: send logged user data to frontend
            return res.status(200).json({message: 'You are successfully logged in!', loggedUser})
        })
    });
});

// logout

// password change

app.post('/users/:uid/passmod', (req, res) => {
    const {oldpass, newpass, confirm, userID} = req.body; // Átvesszük a frontendtől érkező adatokat
    const uid = req.params.uid; // Kiolvassuk az url-ből a userID-t

    // megnézzük hogy minden kötelezőt megadott-e
    if (!oldpass || !newpass || !confirm){
        return res.status(400).json({error: 'Missing required fields'});
    }

    // megnezzuk hogy az uj megegyezik e
    if (newpass != confirm){
        return res.status(400).json({error: 'The new password and it\'s confirm doesn\'t match!'});
    }

    
    if(oldpass == newpass){
        return res.status(400).json({error: 'The new password equals with old password!'});
    }

    //TODO: newpassword strenght check with regular expression

    if (!newpass.match(pwdRegExp)){
        return res.status(400).json({error: 'The new password is not strong enough!'});
    }

        pool.query('SELECT * FROM users WHERE ID=?',[uid], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }

        if(results.length == 0){
            return res.status(400).json({error: 'User with this doesn\'t exist!'});
        }

        // hash-eljuk a megadott jelenlegi jelszot, hogy ossze tudjuk hasonlitani az adatbazisban levovel
        const oldpassHash = sha1(oldpass);

        console.log(oldpassHash);

        if (results[0].passwd != oldpassHash){
            return res.status(400).json({error: 'The old password in not correct!'});
        }

        // Update password
        pool.query('UPDATE users SET passwd = SHA1(?) WHERE ID=?', [newpass, uid], (error,results) => {
            if(error){
                return res.status(500).json({error: 'Database query error'});
            }

            return res.status(200).json({message: 'The password successfully modified!'})
        });
    });
});

// get profile 

app.get('/users/:uid', (req, res) => {
    const uid = req.params.uid;

    if (!uid){
        return res.status(400).json({error: 'Missing user identifier'})         
    }

    pool.query('SELECT * FROM users WHERE ID=?', [uid], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'})
        }

        if(results.length == 0){
            return res.status(400).json({error: 'User with this ID doesn\'t exits!'});
        }

        let user ={
            "name": results[0].name,
            "email": results[0].email,
            "role": results[0].role,
            "created_at": results[0].created_at
        }
        
        return res.status(200).json({results: user});
        
    });
});

// update profile
app.patch('/users/:uid', (req, res) => {
    const uid = req.params.uid;
    const {username, email, loggedUserID} = req.body;

    if(!uid || !username || !email || !loggedUserID){
        return res.status(400).json({error: 'Missing required fields'});
    }
    if(uid != loggedUserID){
        return res.status(400).json({error: 'You don\'t have permission to update this user!'});
    }
    pool.query('SELECT * FROM users WHERE ID=?', [uid], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }
        if(results.length == 0){
            return res.status(400).json({error: 'User with this ID doesn\'t exist!'});
        }
        if(username == results[0].name && email == results[0].email){
            return res.status(200).json({error: 'No changes detected!'});
        }
        pool.query('SELECT * FROM users WHERE email=? AND ID<>?', [email, uid], (error, results2) => {
            if(error){
                return res.status(500).json({error: 'Database query error'});
            }
            if(results2.length > 0){
                return res.status(400).json({error: 'This e-mail already exists!'});
            }

            pool.query('UPDATE users SET name=?, email=? WHERE ID=?', [username, email, uid], (error) => {
                if(error){
                    return res.status(500).json({error: 'Database update error'});
                }

                return res.status(200).json({message: 'Profile updated successfully!'});
            });
        });
    });
});

app.delete('/users/:uid', (req, res) => {
    const uid = req.params.uid;
    const loggedUserID = req.body.luid;

    if(!uid){
        return res.status(400).json({error: 'Missing user identifier'});
    }

    if(uid != loggedUserID){
        return res.status(400).json({error: 'You don\'t have permission to delete this user!'});
    }

    pool.query('DELETE FROM users WHERE ID=?', [uid], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }

        if(results.affectedRows == 1){
            return res.status(200).json({error: 'User deleted successfully!'})
        }
        
        return res.status(200).json({message: 'No deletion occured!'});

    });
});

// STEP ENDPOINTS ---------------------

// create step
app.post('/steps', (req, res) => {
    const { luid, step_count, date } = req.body;

    if ( !luid || step_count === undefined || !date) {
        return res.status(400).json({error: 'Missing required fields'});
    }

   //check stepcount is more than 0 
    if (step_count < 0) {
        return res.status(400).json({error: 'Step count must be a positive number'});
    }

    //check the date is today or past date
    const today = new Date();
    const inputDate = new Date(date);
    if (inputDate > today) {
        return res.status(400).json({error: 'Date cannot be in the future'});
    }

    pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }

        if(results.length == 0){
            return res.status(400).json({error: 'User with this ID doesn\'t exist!'});
        }

    pool.query('SELECT * FROM steps WHERE user_id=? AND date=?', [luid, date], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }
        if(results.length > 0){
            return res.status(400).json({error: 'Steps for this date already exist!'});
        }


        pool.query(
            'INSERT INTO steps (user_id, step_count, date) VALUES (?, ?, ?)',[luid, step_count, date],
            (error, results) => {
                if(error){
                    return res.status(500).json({error: 'Database insert error'});
                }

                return res.status(200).json({
                    message: 'Steps successfully created!',
                    stepID: results.insertId
                });
            });
        })
    });
});

// get steps (users) - table view, calendar view, chart view
app.get('/steps/:uid', (req, res) => {
    const uid = req.params.uid;

    if (!uid) {
        return res.status(400).json({error: 'Missing user identifier'});
    }

    pool.query('SELECT * FROM users WHERE ID=?', [uid], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }

        if(results.length == 0){
            return res.status(400).json({
                error: 'User with this ID doesn\'t exist!'
            });
        }

        pool.query(
            'SELECT * FROM steps WHERE user_id=? ORDER BY date DESC',
            [uid],
            (error, results) => {
                if(error){
                    return res.status(500).json({error: 'Database query error'});
                }

                return res.status(200).json(results);
            }
        );
    });
});

// update steps
app.patch('/steps/:stepID', (req, res) => {
    const stepID = req.params.stepID;
    const luid = req.body.luid;
    const { step_count, date } = req.body;

    if (!stepID || !luid || step_count === undefined || !date) {
        return res.status(400).json({error: 'Missing required fields'});
    }

    pool.query('SELECT * FROM steps WHERE id=?', [stepID], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }

        if(results.length == 0){
            return res.status(400).json({
                error: 'Step with this ID doesn\'t exist!'
            });
        }

        if(results[0].user_id != luid){
            return res.status(400).json({
                error: 'You don\'t have permission to update this step!'
            });
        }

        pool.query(
            'UPDATE steps SET step_count=?, date=? WHERE id=?',
            [step_count, date, stepID],
            (error) => {
                if(error){
                    return res.status(500).json({
                        error: 'Database update error'
                    });
                }

                return res.status(200).json({
                    message: 'Steps successfully modified!'
                });
            }
        );
    });
});



// delete steps
app.delete('/steps/:stepID', (req, res) => {
    const stepID = req.params.stepID;
    const luid = req.body.luid;

    if (!stepID || !luid) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }

    pool.query('SELECT * FROM steps WHERE id=?', [stepID], (error, results) => {
        if(error){
            return res.status(500).json({
                error: 'Database query error'
            });
        }

        if(results.length == 0){
            return res.status(400).json({
                error: 'Step with this ID doesn\'t exist!'
            });
        }

     

        pool.query('DELETE FROM steps WHERE id=?', [stepID], (error, results) => {
            if(error){
                return res.status(500).json({
                    error: 'Database delete error'
                });
            }

            if(results.affectedRows == 1){
                return res.status(200).json({
                    message: 'Steps successfully deleted!'
                });
            }

            return res.status(200).json({
                message: 'No deletion occurred!'
            });
        });
    });
});
// ADMIN ENDPOINTS --------------------

// get all users

app.post('/admin/users', (req, res) => {
    const { luid } = req.body;

    pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results) => {
        if(error){
            console.log(error); // ezt is érdemes ideiglenesen hozzáadni
            return res.status(500).json({error: 'Database query error'});
        }

        if(results.length == 0){
            return res.status(400).json({
                error: 'Logged user with this ID doesn\'t exist!'
            });
        }

        if(results[0].role != 'admin'){
            return res.status(400).json({
                error: 'You don\'t have permission to view all users!'
            });
        }

        pool.query('SELECT * FROM users', (error, results) => {
            if(error){
                console.log(error);
                return res.status(500).json({
                    error: 'Database query error'
                });
            }

            return res.status(200).json(results);
        });
    });
});
// deny user
app.patch('/admin/status', (req, res) => {
    const { uid, luid} = req.body;
    if(!uid || !luid){
        return res.status(400).json({error: 'Missing user identifier'});
    }
    pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }
        if(results.length == 0){
            return res.status(400).json({error: 'Logged user with this ID doesn\'t exist!'});
        }
       
        if(results[0].role != 'admin'){
            return res.status(400).json({error: 'You don\'t have permission to update user status!'});
        }
    pool.query('SELECT * FROM users WHERE ID=?', [uid], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }
        if(results.length == 0){
            return res.status(400).json({error: 'User with this ID doesn\'t exist!'});
        }
      
        pool.query('UPDATE users SET is_active=not is_active WHERE ID=?', [uid], (error, results) => {
            if(error){
                return res.status(500).json({error: 'Database update error'});
            }
            return res.status(200).json({message: 'User status updated successfully!'});
        });
        
    });
    });
});
// statistics (total steps, avarage steps, top users)
app.post('/admin/statistics', (req, res) => {
    const luid = req.body.luid;
    if(!luid){
        return res.status(400).json({error: 'Missing user identifier'});
    }

    pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results) => {
        if(error){
            return res.status(500).json({error: 'Database query error'});
        }

        if(results.length == 0){
            return res.status(400).json({error: 'Logged user with this ID doesn\'t exist!'});
        }

        if(results[0].role != 'admin'){
            return res.status(400).json({error: 'You don\'t have permission to view statistics!'});
        }
         
        pool.query(`
            SELECT
             COALESCE(SUM(step_count), 0) AS totalSteps,
             COALESCE(AVG(step_count), 0) AS averageSteps
              FROM steps;
            SELECT u.name, u.email, COALESCE(SUM(s.step_count), 0) AS steps
            FROM users u
            JOIN steps s ON u.ID = s.user_id
            GROUP BY u.ID, u.name, u.email
            ORDER BY steps DESC
            LIMIT 0,3;
        `, (error, results) => {
            if(error){
                return res.status(500).json({error: 'Database query error'});
            }
            console.log(results);
            return res.status(200).json(results);
        });
        


    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    
})