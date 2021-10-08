const express = require('express');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');

const app = express();

const id = [1,2]
let messages = [1,1]


app.use([cookieParser(), express.json(), express.urlencoded()]);

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "toor",
    database: "firstdatabase"
})

db.connect((err) => {
    if(err) throw err;
    console.log("MySQL is connected...")
})

app.get("/", (req, res) =>
{
    res.send("<div>Login from <a href='/login'>here.</a></div><div>Create account <a href='/create'>here.</a></div>");
})

app.get("/script.js", (req, res) =>
{
    res.sendFile(__dirname+"/script.js")
})


app.get('/login', (req, res) =>
{
    const cookie = req.cookies.sessionId;
    if(cookie) {
        const sessionTime = parseInt(cookie.slice(7,20));
        const time = new Date().getTime();
        console.log(cookie+"  "+sessionTime + "  " + time)
        if (sessionTime < time) {
            res.clearCookie("sessionId");
            res.send("<div>Your session has expried</div><form method=\"post\">\n" +
                "  <label for=\"username\">Enter Username:</label>\n" +
                "  <input id=\"username\" type=\"text\" name=\"username\" required><br>\n" +
                "  <label for=\"password\">Enter Password:</label>\n" +
                "  <input id=\"password\" type=\"password\" name=\"password\" required><br>\n" +
                "  <button type=\"submit\">Login</button>\n" +
                "</form>")
        }
        else
        {
            const query = `select username from users where session='${cookie}'`;
            db.query(query, (err, result) =>
            {
                if(err) throw err;
                if(result[0])
                {
                    const username = result[0].username;
                    const secondQuery = `select secret from users where username='${username}'`;
                    db.query(secondQuery, (err, result) => {
                        if(err) throw err;
                        const newSession = cookie.slice(0,7) + ((new Date().getTime()) + 10000).toString();
                        const thirdQuery = `update users set session= '${newSession}' where username='${username}'`;
                        db.query(thirdQuery, err => {if(err) throw err});
                        res.cookie("sessionId",newSession);
                        // res.redirect('/chat')
                        if(result[0])
                        {
                            res.send(`<div>Hello ${username}</div><div>Your secret is : ${result[0].secret}</div><a href="/logout">Logout</a>`)
                        }
                        else
                        {
                            res.send(`<div>Hello ${username}</div><a href="/logout">Logout</a>`);
                        }
                    })
                }
                else
                {
                    res.clearCookie('sessionId');
                    res.redirect('/logout')
                }
            })
        }
    }
    else
    {
        res.send("<div>Login</div><form method=\"post\">\n" +
            "<input id='type' name='type' value='login' hidden>"+
            "  <label for=\"username\">Enter Username:</label>\n" +
            "  <input id=\"username\" type=\"text\" name=\"username\" required><br>\n" +
            "  <label for=\"password\">Enter Password:</label>\n" +
            "  <input id=\"password\" type=\"password\" name=\"password\" required><br>\n" +
            "  <button type=\"submit\">Login</button>\n" +
            "</form>")
    }
})


app.get('/create', (req, res) =>
{
    res.send("<div>Create a new account</div><form method=\"post\">\n" +
        "  <label for=\"username\">Enter Username:</label>\n" +
        "  <input id=\"username\" type=\"text\" name=\"username\" required><br>\n" +
        "  <label for=\"password\">Enter Password:</label>\n" +
        "  <input id=\"password\" type=\"password\" name=\"password\" required><br>\n" +
        "  <label for=\"secret\">Enter Secret:</label>\n" +
        "  <input id=\"secret\" type=\"text\" name=\"secret\" required maxlength='255'><br>\n" +
        "  <button type=\"submit\">Create</button>\n" +
        "</form>")
})

app.get("/chat", (req, res) =>
{
    res.sendFile(__dirname+"/index.html");
})

app.get('/logout', (req, res) =>
{
    res.clearCookie("sessionId")
    res.redirect("../login");
})


app.post('/login', (req, res) =>
{
    const username = req.body.username;
    const password = req.body.password;

    console.log(username + "  " + password)
    const query = `select password from users where username='${username}'`;

    db.query(query, (err, result) =>
    {
        if(err) throw err;
        console.log(result[0])
        if(result[0])
        {

            if(password === result[0].password)
            {
                const session = (Math.floor((Math.random() * 10000000))).toString() + ((new Date().getTime()) + 10000).toString();
                const thirdQuery = `update users set session= '${session}' where username='${username}'`;
                db.query(thirdQuery, err => {if(err) throw err});
                res.cookie('sessionId', session);
                res.redirect('../login');

            }
            else
            {
                res.send("<div>The username or password is wrong</div><form method=\"post\">\n" +
                    "<input id='type' name='type' value='login' hidden>"+
                    "  <label for=\"username\">Enter Username:</label>\n" +
                    "  <input id=\"username\" type=\"text\" name=\"username\" required><br>\n" +
                    "  <label for=\"password\">Enter Password:</label>\n" +
                    "  <input id=\"password\" type=\"password\" name=\"password\" required><br>\n" +
                    "  <button type=\"submit\">Login</button>\n" +
                    "</form>")
            }
        }
        else
        {
            res.send("<div>The username or password is wrong</div><form method=\"post\">\n" +
                "<input id='type' name='type' value='login' hidden>"+
                "  <label for=\"username\">Enter Username:</label>\n" +
                "  <input id=\"username\" type=\"text\" name=\"username\" required><br>\n" +
                "  <label for=\"password\">Enter Password:</label>\n" +
                "  <input id=\"password\" type=\"password\" name=\"password\" required><br>\n" +
                "  <button type=\"submit\">Login</button>\n" +
                "</form>")
        }
    })
})

app.post('/create', (req, res) =>
{
    const username = req.body.username;
    const password = req.body.password;
    const secret = req.body.secret;

    const query = `select password from users where username='${username}'`;

    db.query(query, (err, result) =>
    {
        if(err) throw err;
        if(result[0])
        {
            res.send("<div>This username is taken</div><form method=\"post\">\n" +
                "<input id='type' name='type' value='login' hidden>"+
                "  <label for=\"username\">Enter Username:</label>\n" +
                "  <input id=\"username\" type=\"text\" name=\"username\" required><br>\n" +
                "  <label for=\"password\">Enter Password:</label>\n" +
                "  <input id=\"password\" type=\"password\" name=\"password\" required><br>\n" +
                "  <label for=\"secret\">Enter Secret:</label>\n" +
                "  <input id=\"secret\" type=\"text\" name=\"secret\" required maxlength='255'><br>\n" +
                "  <button type=\"submit\">Create</button>\n" +
                "</form>")
        }
        else
        {
            const session = (Math.floor((Math.random() * 10000000))).toString() + ((new Date().getTime()) + 10000).toString();
            const secondQuery = `insert into users values('${username}', '${password}', '${secret}', '${session}')`;
            db.query(secondQuery, (err, result) =>
            {
                if(err) throw err;
                res.cookie("sessionId", session);
                res.redirect("../login")
            })
        }
    })
})

app.post("/id", (req, res) =>
{
    res.json({id: id.pop()})
})

app.post('/event', (req, res) =>
{
    console.log(req.body)
    const temp = req.body.id;
    messages[temp-1] = res;
    console.log(messages)
})

app.post('/send', (req, res) =>
{
    const text = req.body.message;
    const id = req.body.id;
    try{
        if(id === 1) messages[1].json({message: text});
        else messages[0].json({message: text});
    }
    catch (err)
    {
        console.log(err)
    }
    res.end();
})









// app.get("/", (req, res) => {
//     res.sendFile(__dirname+"/index.html");
// })
//
// app.get("/login", (req, res) =>
//     {
//         const cookie = parseInt(req.cookies.session_id);
//         if(sessions.includes(cookie))
//         {
//             res.send("your are logged in <br> <form method='post'><input type='hidden' name='logout' value='logout'><button type='submit'>Logout</button> </form> ");
//         }
//         else
//         {
//             res.redirect('/');
//         }
//     }
// )
//
// app.post("/login", (req, res) =>
// {
//     if(req.body.logout === "logout")
//     {
//         res.clearCookie('session_id');
//         res.redirect('/')
//     }
// })
//
// app.post("/", (req, res) => {
//
//     let username = req.body.username;
//     let password = req.body.password;
//
//     const query = `select password from users where username='${username}';`
//
//     db.query(query, (err, result) =>
//     {
//         if(err) console.log(err);
//         if(result[0])
//         {
//             if(password === result[0].password)
//             {
//                 const id = Math.floor(Math.random()*100000);
//                 sessions.push(id);
//                 res.cookie("session_id", id);
//                 res.redirect('/login')
//             }
//             else
//             {
//                 res.redirect('/');
//             }
//         }
//         else
//         {
//             res.redirect('/');
//         }
//     })
// })



app.listen(169, () => {
    console.log("Server is up...")
})