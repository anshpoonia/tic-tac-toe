document.addEventListener("DOMContentLoaded", () => {
    let otherUserID;

    const HOST = location.origin.replace(/^http/, 'ws')
    const ws = new WebSocket(HOST)

    ws.onopen = () => {
        console.log("-*- WebSocket is connected -*-")
        ws.send(JSON.stringify(["userID", USER_ID]))
    }
    setInterval(() => ws.send(JSON.stringify(["ping"])), 30000)


    let oScore = 0;
    let drawScore = 0;
    let xScore = 0

    let isMyTurn = false;
    let mySymbol = null;

    const winingCombinations = [
        [1, 4, 7],
        [2, 5, 8],
        [3, 6, 9],
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [1, 5, 9],
        [3, 5, 7],
    ]


    //BackGround Animation

    let scene, camera, renderer, cube;

    const canvas = document.querySelector('.backgroundAnimation')

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas: canvas});

        renderer.setSize(window.innerWidth, window.innerHeight)


        const geometry = new THREE.DodecahedronGeometry(5, 2);
        // const material = new THREE.MeshPhongMaterial({wireframe: true, emissive: 0x000000})
        const material = new THREE.PointsMaterial({
            size: 0.03
        })
        cube = new THREE.Points(geometry, material)

        scene.add(cube)
        camera.position.z = 2;

    }

    function animate() {
        requestAnimationFrame(animate)

        cube.rotation.y += 0.001;
        cube.rotation.x += 0.0005;

        renderer.render(scene, camera)
    }

    function onReSize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', onReSize, false)
    init()
    animate()


    //Create the room
    const createRoomButton = document.querySelector(".createRoomButton")

    createRoomButton.addEventListener("click", createRoom)

    function createRoom() {
        console.log("-*- The request to create room has been sent -*-")
        mainMenuBackButton.removeEventListener('click', closeMenu)
        mainMenuBackButton.style.opacity = "0"
        ws.send(JSON.stringify(["create"]))
    }


    //Join a room
    const joinRoomInputBox = document.querySelector(".joinRoomInputBox")
    const joinRoomButton = document.querySelector(".joinRoomButton")
    const joinRoomStatusMessage = document.querySelector(".joinRoomStatusMessage")

    joinRoomButton.addEventListener("click", joinRoom)
    joinRoomInputBox.addEventListener("keydown", (e) => {
        if (e.code === "Enter") joinRoom()
    })

    function joinRoom() {
        const enteredCode = joinRoomInputBox.value;
        if (enteredCode.length === 6) {
            ws.send(JSON.stringify(["join", enteredCode]))
        } else {
            joinRoomInputBox.value = ""
            joinRoomInputBox.focus()
            joinRoomStatusMessage.innerText = "Room Code should be of 6 characters"
        }
    }


    //Room Code received

    const mainMenuWindow = document.querySelector(".mainMenuWindow")
    const codeWindow = document.querySelector(".codeWindow")
    const roomCodeDisplayMessage = document.querySelector(".roomCodeDisplayMessage")
    const joinRoomBackLinkButton = document.querySelector(".joinRoomBackLinkButton")

    function roomCodeReceived(roomCode) {

        joinRoomInputBox.style.border = "none"
        mainMenuWindow.style.clipPath = "inset(0 100% 0 0)"
        codeWindow.style.clipPath = "inset(0 0 0 0)"
        document.querySelector('.roomCodeDisplayValue').innerText = roomCode
        joinRoomBackLinkButton.addEventListener("click", joinRoomInstead)


        try {
            document.querySelector(".roomCodeCopyButton").addEventListener('click', () => {
                navigator.clipboard.writeText(roomCode).then(s => {
                    roomCodeDisplayMessage.innerText = "Copied!"
                }).catch(e => {
                    roomCodeDisplayMessage.innerText = "Unable to Copy!"
                })
            })
        } catch (e) {
            roomCodeDisplayMessage.innerText = "Unable to Copy!"
        }

    }


    //Join room instead

    function joinRoomInstead() {
        console.log("-*- Join room instead -*-")

        ws.send(JSON.stringify(['joinInstead']))

        codeWindow.style.clipPath = "inset(0 0 0 100%)"
        mainMenuWindow.style.clipPath = "inset(0 0 0 0)"
    }

    //join room message display

    function joinRoomMessageDisplayFunction(message) {
        joinRoomInputBox.style.border = "yellow 1px solid"
        joinRoomStatusMessage.innerText = message

        setTimeout(() => joinRoomStatusMessage.innerText = "", 5000)
    }

    //Room Joined

    const gameWindow = document.querySelector('.gameWindow')
    const xScoreDisplay = document.querySelector('#xScoreDisplay')
    const oScoreDisplay = document.querySelector('#oScoreDisplay')
    const drawScoreDisplay = document.querySelector('#drawScoreDisplay')


    function roomJoined() {
        mainMenuWindow.style.clipPath = "inset(0 100% 0 0)"
        codeWindow.style.clipPath = "inset(0 100% 0 0)"
        gameWindow.style.clipPath = "inset(0 0 0 0)"
    }

    //Make a turn
    function makeATurn() {
        if (isMyTurn) {
            const num = this.getAttribute("data-id")
            ws.send(JSON.stringify(["place", mySymbol, num]))
        }
    }

    //Place Symbol
    let occupiedPositions = [0, 0, 0, 0, 0, 0, 0, 0, 0]

    function placeSymbol(symbol, place) {
        placeHolders.forEach((e, index) => {
            const num = e.getAttribute("data-id")
            if (num === place) {
                e.innerHTML = (symbol === "x") ? "<svg fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><line x1=\"18\" x2=\"6\" y1=\"6\" y2=\"18\"/><line x1=\"6\" x2=\"18\" y1=\"6\" y2=\"18\"/></svg>" : "<svg fill=\"none\" stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\"/></svg>"
                occupiedPositions[index] = (symbol === "x") ? 1 : 2
            }
        })

        if (symbol === "x") {
            document.querySelector('.xSymbolDisplay').classList.remove("playerSymbol");
            document.querySelector('.oSymbolDisplay').classList.add("playerSymbol")
        } else {
            document.querySelector('.xSymbolDisplay').classList.add("playerSymbol")
            document.querySelector('.oSymbolDisplay').classList.remove("playerSymbol");
        }

        isMyTurn = !isMyTurn
        checkForWin()
    }

    //Check for win

    function checkForWin() {

        winingCombinations.forEach(e => {
            const a = e[0] - 1
            const b = e[1] - 1
            const c = e[2] - 1
            if (occupiedPositions[a] === 1 && occupiedPositions[b] === 1 && occupiedPositions[c] === 1) {
                console.log("-*- Player with X symbol has won -*-")
                xScore += 1;
                xScoreDisplay.innerText = `${xScore}`
                winDisplay("x")

            } else if (occupiedPositions[a] === 2 && occupiedPositions[b] === 2 && occupiedPositions[c] === 2) {
                console.log("-*- Player with O symbol has won -*-")
                oScore += 1;
                oScoreDisplay.innerText = `${oScore}`
                winDisplay("o")
            }
        })
        if (occupiedPositions.indexOf(0) === -1) {
            console.log("-*- It is a draw -*-")
            drawScore += 1;
            drawScoreDisplay.innerText = `${drawScore}`
            winDisplay("d")
        }
    }

    //Win display

    const gameBoardDisplay = document.querySelector(".gameBoardDisplay")

    function winDisplay(symbol) {
        placeHolders.forEach(e => {
            e.innerHTML = ""
        })

        gameBoardDisplay.innerHTML = ""
        gameBoardDisplay.style.backgroundColor = "linear-gradient(to right top, #65dfc9, #6cdbeb)"

        if (symbol === "d") {
            gameBoardDisplay.innerHTML = "<div class='gameBoardMessage'>Draw</div>"
        } else if (symbol === mySymbol) {
            gameBoardDisplay.innerHTML = "<div class='gameBoardMessage'>You won</div>"
        } else {
            gameBoardDisplay.innerHTML = "<div class='gameBoardMessage'>You lost</div>"
        }
        document.querySelector(".gameBoardMessage").addEventListener("click", () => ws.send(JSON.stringify(["restart"])))
    }

    //Restart game

    function restartGame() {
        gameBoardDisplay.innerHTML = ""
        placeHolders.forEach(e => {
            gameBoardDisplay.appendChild(e)
            e.addEventListener('click', makeATurn)
        })

        occupiedPositions = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        document.querySelector('.xSymbolDisplay').classList.remove("playerSymbol")
        document.querySelector('.oSymbolDisplay').classList.remove("playerSymbol")

        if (isMyTurn)
            if (mySymbol === "x")
                document.querySelector('.xSymbolDisplay').classList.add("playerSymbol")
            else
                document.querySelector('.oSymbolDisplay').classList.add("playerSymbol")
        else if (mySymbol === "o")
            document.querySelector('.xSymbolDisplay').classList.add("playerSymbol")
        else
            document.querySelector('.oSymbolDisplay').classList.add("playerSymbol")
    }


    //Start game

    const placeHolders = document.querySelectorAll(".gamePlaceHolders")
    placeHolders.forEach(e => {
        e.addEventListener('click', makeATurn)
    })

    const menuNavButton = document.querySelector('#menuNavButton')
    const chatNavButton = document.querySelector("#chatNavButton")
    const mainMenuBackButton = document.querySelector(".mainMenuBackButton")
    menuNavButton.addEventListener("click", openMenu)
    chatNavButton.addEventListener("click", openChatWindow)

    function startGame(isTurn) {
        if (isTurn) {
            document.querySelector('.xSymbolDisplay').classList.add("playerSymbol")
            document.querySelector('#xIcon').style.stroke = "#92d293"

            isMyTurn = true
            mySymbol = "x"
        } else {
            document.querySelector('.xSymbolDisplay').classList.add("playerSymbol")
            document.querySelector('#oIcon').style.stroke = "#92d293"
            mySymbol = "o"
        }

        mainMenuBackButton.style.opacity = "1"
        mainMenuBackButton.addEventListener("click", closeMenu)
    }

    //open menu
    function openMenu() {
        mainMenuWindow.style.clipPath = "inset(0 0 0 0)"
        codeWindow.style.clipPath = "inset(0 0 0 100%)"
        gameWindow.style.clipPath = "inset(0 0 0 100%)"
    }

    //close menu
    function closeMenu() {
        mainMenuWindow.style.clipPath = "inset(0 100% 0 0)"
        codeWindow.style.clipPath = "inset(0 100% 0 0)"
        gameWindow.style.clipPath = "inset(0 0 0 0)"
    }

    //open chat
    const chatWindow = document.querySelector(".chatWindow")

    function openChatWindow() {
        gameWindow.style.clipPath = "inset(0 100% 0 0)"
        chatWindow.style.clipPath = "inset(0 0 0 0)"
    }

    //Chats area
    //Sending a chat

    const textBox = document.querySelector('.textBox')
    const sendChatButton = document.querySelector('.sendChatButton')
    const chatContainer = document.querySelector('.chatContainer')
    const chatWrapper = document.querySelector('.chatContainer .wrapper')
    const chatBackButton = document.querySelector('.chatBackButton')

    sendChatButton.addEventListener("click", sendChat)
    chatBackButton.addEventListener("click", closeChatWindow)
    textBox.addEventListener("keydown", (e) => {
        if (e.code === "Enter") sendChat()
    })

    function closeChatWindow() {
        chatWindow.style.clipPath = "inset(0 0 0 100%)"
        gameWindow.style.clipPath = "inset(0 0 0 0)"
    }

    function sendChat() {
        const enteredMessage = textBox.value

        if (enteredMessage.length > 0) {
            textBox.value = ""
            printChat(USER_ID, enteredMessage)
            fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                body: JSON.stringify({
                    code: "CHAT",
                    myuserid: USER_ID,
                    otheruserid: otherUserID,
                    message: enteredMessage
                })
            })
                .then(res => {
                    if (res.status >= 200 && res.status < 300) return res.json()
                    else throw new Error("Problem with request" + res.statusText)
                })
                .then(data => {
                    const status = data.code
                    if (status === "SUCCESS") {
                        console.log("-*- The message has been sent -*-")
                    } else {
                        console.log("-*- The message sending failed -*-")
                    }
                })
        }
        textBox.focus()
    }

    let eventCount = 0;

    function event() {
        eventCount += 1
        console.log("-*- Send a request for Event number: " + eventCount + "-*-")
        fetch("/event", {
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({code: "EVENT", userid: USER_ID})
        })
            .then(res => {
                if (res.status >= 200 && res.status < 300) return res.json()
                else throw new Error("Problem with request" + res.statusText)
            })
            .then(data => {
                const status = data.code
                const id = data.userid
                const message = data.message

                if (status === "CHAT") {
                    printChat(id, message)
                }
                console.log("-*- The answer to the event number: " + eventCount + " has been answered -*-")
                event()
            })
            .catch(err => console.log(err))
    }

    function printChat(userID, message) {
        const div = document.createElement("div")
        div.innerText = message
        if (userID === USER_ID) {
            div.classList.add("sentMessages")
        } else {
            div.classList.add("receivedMessages")
        }
        chatWrapper.appendChild(div)
        chatContainer.scrollTop = chatContainer.scrollHeight
    }


    //Calling WebRTC functionality

    const audioMessage = document.querySelector('.audioMessage')
    const audioButtonOne = document.querySelector('.audioButtonOne')
    const audioButtonTwo = document.querySelector(".audioButtonTwo")

    const videoDisplay = document.querySelector(".videoDisplay")
    const myVideoDisplay = document.querySelector(".myVideoDisplay")
    const otherVideoDisplay = document.querySelector(".otherVideoDisplay")
    const endCallButton = document.querySelector('.callEndButton')


    const configuration = {
        iceServers:
            [{
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302"
                ]
            }]
    }

    const audioConfiguration = {
        audio: true,
        video: {
            width: { min: 1024, ideal: 1280, max: 1920 },
            height: { min: 576, ideal: 720, max: 1080 }
        }
    }

    let iceCandidates = []

    let peerConnection;
    let streamMedia;
    let isCallAccepted;


    audioButtonOne.addEventListener("click", makeTheCall)


    function makeTheCall() {
        audioMessage.innerText = "Calling..."
        audioButtonOne.removeEventListener("click", makeTheCall)

        console.log("-*- The request for call is being made -*-")

        peerConnection = new RTCPeerConnection(configuration)

        peerConnection.ontrack = e => {
            otherVideoDisplay.autoplay = true
            otherVideoDisplay.srcObject = e.streams[0]

            console.log("-*- Video is connected -*-")

            audioMessage.innerText = "Connected"

            audioButtonOne.style.opacity = "0"
            audioButtonTwo.style.opacity = "1"
            audioButtonTwo.addEventListener('click', sendDisconnectMessage)
        }

        const dataChannel = peerConnection.createDataChannel("channel")
        dataChannel.onopen = e => {
            console.log("-*- Data channel is open -*-")

            gameWindow.style.clipPath = "inset(0 0 100% 0)"
            videoDisplay.style.clipPath = "inset(0 0 0 0)"

            endCallButton.addEventListener('click', sendDisconnectMessage)
        }

        peerConnection.onicecandidate = e => {
            if (e.candidate) {
                console.log("-*- one ICE Candidate is sent -*-")
                ws.send(JSON.stringify(["iceCandidates", USER_ID, {ice: e.candidate}]))
            }
        }

        navigator.mediaDevices.getUserMedia(audioConfiguration).then(stream => {
            streamMedia = stream
            myVideoDisplay.autoplay = true
            myVideoDisplay.srcObject = stream

            stream.getTracks().forEach(track => {
                console.log("-*- Audio is added to the stream -*-")
                peerConnection.addTrack(track, stream)
            })

            console.log("-*- The request for call is being sent to the other user -*-")
            ws.send(JSON.stringify(["calling", USER_ID]))
        }).catch(e => {
            audioButtonOne.style.opacity = "0"
            audioMessage.innerText = "Permission Denied"
            console.log("-*- The permission of audio is denied so call can't be made now -*-")
        })

    }


    function makeTheOffer() {
        peerConnection.createOffer().then(o => {
            peerConnection.setLocalDescription(o).then(e => {
                console.log("-*- Local description of peer connection is set -*-")
                setTimeout(() => {
                    console.log("-*- Offer is sent to the other user -*-")
                    ws.send(JSON.stringify(["offer", USER_ID, peerConnection.localDescription]))
                }, 2000)
            })
        }).catch(e => console.log(e))
    }

    function acceptTheAnswer(answer) {
        peerConnection.setRemoteDescription(answer).then(e => console.log("-*- Remote description of peer connection is set -*-"))
        addIceCandidates()
    }


    function receivingCall() {
        console.log("-*- There is an incoming call -*-")
        audioMessage.innerText = "Incoming"
        audioButtonOne.removeEventListener('click', makeTheCall)
        audioButtonOne.addEventListener('click', acceptTheCall)
        audioButtonTwo.style.opacity = "1"
        audioButtonTwo.addEventListener('click', rejectTheCall)
    }

    function acceptTheCall() {
        console.log("-*- The call has been accepted -*-")
        peerConnection = new RTCPeerConnection(configuration)

        audioButtonOne.removeEventListener('click', acceptTheCall)
        audioButtonTwo.removeEventListener('click', rejectTheCall)

        peerConnection.ontrack = e => {
            otherVideoDisplay.autoplay = true
            otherVideoDisplay.srcObject = e.streams[0]

            console.log("-*- Video has been connected -*-")

            audioMessage.innerText = "Connected"

            audioButtonOne.style.opacity = "0"
            audioButtonTwo.style.opacity = "1"
            audioButtonTwo.addEventListener('click', sendDisconnectMessage)
        }

        peerConnection.ondatachannel = e => {
            const dataChannel = e.channel
            dataChannel.onopen = e => {
                console.log("-*- The data channel is opened -*-")
                gameWindow.style.clipPath = "inset(0 0 100% 0)"
                videoDisplay.style.clipPath = "inset(0 0 0 0)"

                endCallButton.addEventListener('click', sendDisconnectMessage)
            }
        }

        peerConnection.onicecandidate = e => {
            if (e.candidate) {
                console.log("-*- one ICE candidate is sent -*-")
                ws.send(JSON.stringify(["iceCandidates", USER_ID, {ice: e.candidate}]))
            }
        }

        navigator.mediaDevices.getUserMedia(audioConfiguration).then(stream => {
            streamMedia = stream
            myVideoDisplay.autoplay = true
            myVideoDisplay.srcObject = stream

            stream.getTracks().forEach(track => {
                console.log("-*- Audio is added to the stream -*-")
                peerConnection.addTrack(track, stream)
            })

            console.log("-*- The request of accepted call has been sent -*-")
            ws.send(JSON.stringify(["accepted", USER_ID]))
        }).catch(e => {
            audioButtonOne.style.opacity = "0"
            audioMessage.innerText = "Permission Denied"
            console.log("-*- Audio permission has been denied so call can't be made now -*-")
            console.log("-*- Message of audio permission denied is sent to the other user -*-")
            ws.send(JSON.stringify(["denied", USER_ID]))
        })
    }

    function acceptTheOffer(offer) {
        peerConnection.setRemoteDescription(offer).then(e => {
            console.log("-*- Remote description has been set for the peer connection -*-")
            addIceCandidates()

            peerConnection.createAnswer().then(a => {
                peerConnection.setLocalDescription(a).then(e => console.log("-*- Local description has been set for the peer connection -*-"))
            }).catch(e => console.log(e))

            setTimeout(() => {
                console.log("-*- Answer is sent to the other user -*-")
                ws.send(JSON.stringify(["answer", USER_ID, peerConnection.localDescription]))
            }, 2000)


        })
    }

    function addIceCandidates() {
        console.log("-*- ICE candidate is added -*-")
        iceCandidates.forEach(e => {
            const candidate = e.ice
            peerConnection.addIceCandidate(candidate).then(e => console.log("ice candidate set")).catch(e => console.log(e))
        })
    }

    function rejectTheCall() {
        console.log("-*- Call has been rejected -*-")

        audioMessage.innerText = "rejected"
        audioButtonTwo.removeEventListener('click', rejectTheCall)
        audioButtonOne.removeEventListener('click', acceptTheCall)
        audioButtonTwo.style.opacity = "0"

        console.log("-*- Message of call has been rejected is sent -*-")
        ws.send(JSON.stringify(["rejected", USER_ID]))

        setTimeout(() => {
            audioMessage.innerText = "connect audio"
            audioButtonOne.addEventListener("click", makeTheCall)
        }, 2000)
    }


    function sendDisconnectMessage() {
        console.log("-*- Request for disconnecting the audio has been sent -*-")
        ws.send(JSON.stringify(["disconnect"]))
        audioButtonTwo.removeEventListener('click', sendDisconnectMessage)
    }

    function disconnect() {

        audioMessage.innerText = "disconnecting..."

        myVideoDisplay.srcObject = null
        otherVideoDisplay.srcObject = null

        gameWindow.style.clipPath = "inset(0 0 0 0)"
        videoDisplay.style.clipPath = "inset(100% 0 0 0)"


        endCallButton.removeEventListener('click', sendDisconnectMessage)

        console.log("-*- Closing the peer connection -*-")
        peerConnection.close()

        console.log("-*- Disconnecting the audio -*-")
        streamMedia.getTracks().forEach(e => {
            e.stop()
        })

        audioButtonTwo.removeEventListener('click', sendDisconnectMessage)
        audioButtonTwo.style.opacity = "0"

        audioMessage.innerText = "disconnected"


        setTimeout(() => {
            audioButtonOne.style.opacity = "1"
            audioButtonOne.addEventListener("click", makeTheCall)
            peerConnection = null;
            audioMessage.innerText = "connect audio"
        }, 2000)
    }


    ws.onmessage = (ev => {

        let message = JSON.parse(ev.data)

        const messageType = message[0]

        if (messageType === "roomCode") {
            console.log("-*- The room code has is received  -*-")
            roomCodeReceived(message[1])
        } else if (messageType === "joinRoomMessage") {
            console.log("-*- There is a message regarding join the room -*-")
            joinRoomMessageDisplayFunction(message[1])
        } else if (messageType === "joined") {
            console.log("-*- Room is joined -*-")

            roomJoined()
            if (message[1] !== USER_ID) otherUserID = message[1]
            console.log("-*- My USER_ID: " + USER_ID + " -*-")
            console.log("-*- Other USER_ID: " + otherUserID + " -*-")
            event()
        } else if (messageType === "left") {
            console.log("-*- Other user has left the game -*-")
            joinRoomMessageDisplayFunction(message[1])
        } else if (messageType === 'turn') {
            startGame(message[1])
        } else if (messageType === "place") {
            console.log("-*- The symbol is placed -*-")
            placeSymbol(message[1], message[2])
        } else if (messageType === "restart") {
            console.log("-*- The game is restarted -*-")
            restartGame()
        } else if (messageType === "disconnect") {
            console.log("-*- Disconnect messages is received -*-")
            disconnect()
        } else if (messageType === "iceCandidates") {

            if (USER_ID !== message[1]) {
                console.log("-*- ICE candidate is received -*-")
                iceCandidates.push(message[2])
            }
        } else if (messageType === "calling") {

            if (USER_ID !== message[1]) {
                console.log("-*- Calling request is received -*-")
                receivingCall()
            }
        } else if (messageType === 'accepted') {

            if (USER_ID !== message[1]) {
                console.log("-*- The call has been accepted -*-")
                makeTheOffer()
            }
        } else if (messageType === "offer") {

            if (USER_ID !== message[1]) {
                console.log("-*- The offer is received -*-")
                acceptTheOffer(message[2])
            }
        } else if (messageType === "answer") {

            if (USER_ID !== message[1]) {
                console.log("-*- The answer is received -*-")
                acceptTheAnswer(message[2])
            }
        } else if (messageType === 'denied') {
            if (USER_ID !== message[1]) {
                console.log("-*- Other user has denied the permission to their audio -*-")
                audioMessage.innerText = "permission denied"
                audioButtonOne.style.opacity = "0"
                peerConnection = null

                setTimeout(() => {
                    audioButtonOne.style.opacity = "1"
                    audioButtonOne.addEventListener('click', makeTheCall)
                })
            }
        }

    })
})