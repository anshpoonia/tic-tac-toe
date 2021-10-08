document.addEventListener("DOMContentLoaded", () => {

    const chats = document.getElementById('chats');
    const chatBox = document.getElementById('typeMessage');
    const sendChat = document.getElementById('sendChat');
    let id = 0;

    sendChat.addEventListener("click", sendMessage);
    console.log(1)
    getID();


    function sendMessage() {
        const message = chatBox.value;
        if (message) {
            chatBox.value = "";
            printSMessage(message);
            fetch("/send", {
                method: "POST",
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                body: JSON.stringify({id: id, message: message})
            })
        }
    }

    async function getID() {
        console.log(2);
        const message = await fetch("/id"   , {
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }).then(res => res.json()).then(data => {
            id = data.id;
            console.log(3);
            event();
        })
    }


    async function event() {
        console.log(4);
        const message = await fetch("/event", {
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({id: id})
        }).then(res => res.json()).then(data => {
            printRMessage(data)
        })
    }

    function printRMessage(message) {
        const div = document.createElement("div");
        div.innerText = ">> " + message.message;
        chats.appendChild(div);
        event();
    }

    function printSMessage(message){
        const div = document.createElement("div");
        div.innerText = message;
        chats.appendChild(div);
    }

})