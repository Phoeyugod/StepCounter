async function getAllUsers() {
    const response = await fetch('http://localhost:3000/admin/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ luid: 2 })
    });
    if(response.status !== 200) {
        const res = await response.json();
        showMessage('danger', 'ERROR', res.error);
    } else {
        const users = await response.json();
        drawTable(users);
    }
}
   
function drawTable(users) {
    let usersCount = document.querySelector('#usersCount');
    usersCount.innerHTML = users.length;
    users.forEach((user, index) => {
        addTableRow(user, index);
    });
}
function addTableRow(user, index) {

}