function rename() {
    var name = document.querySelector('[name=username]').value;
    rps.socket.send(JSON.stringify({action: 'rename', name: name}));
}
function choose(el) {
    var choice = el.name;
    rps.socket.send(JSON.stringify({
        action: 'choose',
        choice: choice,
        token: rps.myToken,
    }));
}

