async function registration(){

    let name = document.querySelector('#name').value;
    let email = document.querySelector('#email').value;
    let passwd = document.querySelector('#passwd').value;
    let confirm = document.querySelector('#confirm').value;

    // meg kell szolitani a servert

    let user = {
        name,
        email,
        passwd,
        confirm
    }

    const response = await fetch('http://localhost:3000/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    });

    let res = await response.json();

    if( response.status !== 200) {
        showMessage('danger', 'ERROR', res.error);
    } else {
        showMessage('success', 'SUCCESS', res.message);
        navigate('views/users/login');
    }


  
}

async function login(){

    let email = document.querySelector('#email').value;
    let passwd = document.querySelector('#passwd').value;

    let user = {
        email,
        passwd
    }

    const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    });

    let res = await response.json();

    if( response.status !== 200) {
        showMessage('danger', 'ERROR', res.error);
    } else {
        showMessage('success', 'OK', res.message);
        storeUser(res.loggedUser);
        loginCheck();
        
    }
}

function logout(){
    clearUser();
    loginCheck();
    
    

}

function storeUser(user){
    sessionStorage.setItem('StepCounterUser', JSON.stringify(user));
}
function loadUser(){
    let user = JSON.parse(sessionStorage.getItem('StepCounterUser'));
    return user;
}

function clearUser(){
    sessionStorage.removeItem('StepCounterUser');
}

function loginCheck(){
    let user = loadUser();

    if (user) {
        if (user.role == 'admin') {
            setMenuItems('admin');
            navigate('views/admin/dashboard');
        } else {
            setMenuItems('user');
            navigate('views/users/steps');
        }
    } else {
        setMenuItems('');
        navigate('views/users/login');
    }
}

function setMenuItems(param){
    let baseMenu = document.querySelector('#baseMenu');
    let adminMenu = document.querySelector('#adminMenu');
    let userMenu = document.querySelector('#userMenu');
    switch(param){
        case 'admin' : {
            baseMenu.classList.add('hide');
            adminMenu.classList.remove('hide');
            userMenu.classList.add('hide');
            break;
        }
        case 'user' : {
            baseMenu.classList.add('hide');
            adminMenu.classList.add('hide');
            userMenu.classList.remove('hide');
            break;
        }
        default : {
            userMenu.classList.add('hide');
            adminMenu.classList.add('hide');
            baseMenu.classList.remove('hide');
            break;
        }
    }
}

async function updateProfile(){
    let username = document.querySelector('#name');
    let email = document.querySelector('#email');

    let uid = loadUser() ? loadUser().ID : 0;

    let data = {
        username: username.value,
        email: email.value,
        loggedUserID: uid
    }

    const response = await fetch(`http://localhost:3000/users/${uid}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    let res = await response.json();

    if(response.status != 200) {
        showMessage('danger', 'ERROR', res.error);
    } else {
        showMessage('success', 'OK', res.message);
        let user = {
            ID: uid,
            name: username.value,
            email: email.value,
            role: loadUser().role
        }
        storeUser(user);
    }
}

async function updatePasswd(){
    let oldpass = document.querySelector('#oldpass');
    let newpass = document.querySelector('#newpass');
    let confirm = document.querySelector('#confirm');

    let data = {
        oldpass: oldpass.value,
        newpass: newpass.value,
        confirm: confirm.value
    }

    let uid = loadUser() ? loadUser().ID : 0;

    const response = await fetch(`http://localhost:3000/users/${uid}/passmod`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    let res = await response.json();

    if( response.status != 200) {
        showMessage('danger', 'ERROR', res.error);
    } else {
        showMessage('success', 'OK', res.message);
        oldpass.value = '';
        newpass.value = '';
        confirm.value = '';
    }
}
