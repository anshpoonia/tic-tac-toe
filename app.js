const express = require('express')
const {Server} = require('ws')

const pendingResponse = {}

const server = express()

    .set('view engine', 'ejs')

    .use([ express.json(), express.urlencoded(), express.static('./')])

    .get('/', (req,res) => {
        let userID = ""
        for(let i = 0 ; i < 20; i++) userID = userID + String.fromCharCode(Math.floor(Math.random()*26)+65)
        res.render('index', {userID: userID})
    })

    .post('/event', (req, res) =>
    {
        const userid = req.body.userid
        const random = Math.random()
        res.countNumber = random
        try
        {
            if(pendingResponse[userid]) if(!pendingResponse[userid].finished) pendingResponse[userid].json({code: "FAIL"})
        }
        catch (err)
        {
            console.log(err)
        }
        pendingResponse[userid] = res
        setTimeout(() => {
            if(pendingResponse[userid].countNumber === random) if(!pendingResponse[userid].finished) pendingResponse[userid].json({code: "TIMEOUT"})
        }, 10000)
    })

    .post("/chat", (req, res) =>
    {
        const myuserid = req.body.myuserid
        const otheruserid = req.body.otheruserid
        const message = req.body.message

        if(pendingResponse[otheruserid].finished) res.json({code:"FAIL"})
        else
        {
            pendingResponse[otheruserid].json({code: "CHAT", userid: myuserid, message: message })
            res.json({code: "SUCCESS"})
        }

    })

    .all("*",(req, res) => {
        res.status(404).send("You seem lost, brother!!")
    })

    .listen((process.env.PORT || 3000))


const wss = new Server({server});

const rooms = {}

wss.on('connection', (ws) =>
{
    ws.on('message', (data) =>
    {
        const message = JSON.parse(data)
        console.log(message)

        const messageType = message[0]

        if(messageType === "userID") ws.userID = message[1]

        else if(messageType === "ping") console.log("ping")
        else if(messageType === "create")
        {
            let roomCode = ""
            for(let i = 0 ; i < 6; i++) roomCode = roomCode + String.fromCharCode(Math.floor(Math.random()*26)+65)

            ws.roomCode = roomCode

            rooms[roomCode] = []
            rooms[roomCode].push(ws)
            console.log(rooms[roomCode] + " ---- " + roomCode)

            ws.send(JSON.stringify(["roomCode", roomCode]))
        }

        else if(messageType === "join")
        {
            const roomCode = message[1]
            if(rooms[roomCode])
            {
                console.log("exist")

                let flag = false
                rooms[roomCode].forEach(e =>
                {
                    if(e.userID === ws.userID)
                    {
                        ws.send(JSON.stringify(["joinRoomMessage", "You are already in the room"]))
                        flag = true
                    }
                })

                if(rooms[roomCode].length === 2)
                {
                    if(!flag) ws.send(JSON.stringify(["joinRoomMessage", "The room is full"]))
                }
                else
                {
                    if(!flag)
                    {
                        ws.roomCode = roomCode
                        rooms[roomCode].push(ws)
                        rooms[roomCode].forEach((e, index) =>
                        {
                            if(index === 0) e.send(JSON.stringify(["joined", rooms[roomCode][1].userID]))
                            else e.send(JSON.stringify(["joined", rooms[roomCode][0].userID]))
                        })

                        const num = Math.floor(Math.random()*2)
                        rooms[roomCode][num].send(JSON.stringify(['turn', true]))
                        rooms[roomCode][(num === 1)? 0:1].send(JSON.stringify(['turn', false]))

                    }
                }
            }
            else
            {
                console.log("doesn't exist")
                ws.send(JSON.stringify(["joinRoomMessage", "Room doesn't exist"]))
            }
        }

        else if(messageType === "joinInstead")
        {
            rooms[ws.roomCode] = null;
        }

        else
        {
            rooms[ws.roomCode].forEach(e =>
            {
                e.send(JSON.stringify(message))
            })
        }

    })
})