async function getAllUsers() {
    const response = await fetch('http://localhost:3000/admin/users');

    const users = await response.json();

    console.log(users);

    drawTable(users);
}


function drawTable(users){
    let usersCount = document.querySelector('#usersCount');

    usersCount.innerHTML = users.length;

    users.forEach((user, index) => {
        addTableRow(user,index);
    });

}

function addTableRow(user,index){
        let usersList = document.querySelector('#usersList');

        let tr = document.createElement('tr');

        let td1 = document.createElement('td');
        let td2 = document.createElement('td');
        let td3 = document.createElement('td');
        let td4 = document.createElement('td');
        let td5 = document.createElement('td');
        let td6 = document.createElement('td');
        let td7 = document.createElement('td');

        td1.innerHTML = (index + 1) + '.';
        td2.innerHTML = user.name;
        td3.innerHTML = user.email;
        td4.innerHTML = moment(user.created_at).format('YYYY.MM.DD - H:mm');
        td5.innerHTML = user.last_login ? moment(user.last_login, "YYYYMMDD").fromNow(): 'never';
        td6.innerHTML = user.login_count;
        let isActive = user.is_active ? 'checked' : '';
        td7.innerHTML = '<div class="form-check form-switch float-end"><input class="form-check-input" type="checkbox" role="switch" id="is_active" ' + isActive + '></div>;'
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tr.appendChild(td5);
        tr.appendChild(td6);
        tr.appendChild(td7);

        usersList.appendChild(tr);
}