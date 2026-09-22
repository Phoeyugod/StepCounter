let contentBox = document.querySelector('#content');

let lightModeBtn = document.querySelector('#lightModeBtn');
let darkModeBtn = document.querySelector('#darkModeBtn');

let theme = 'light';
async function navigate(page) {
    contentBox.innerHTML = await (await fetch(`${page}.html`)).text();

    getAllUsers();

    // switch(page){
    //     case 'admin/users' : {
    //         getAllUsers();
    //         break;
    //     }
    // }
}
lightModeBtn.addEventListener('click', () =>{
    let theme = 'ligth';
    setTheme(theme);
});

darkModeBtn.addEventListener('click', () => {
    let theme = 'dark';
    setTheme(theme);
});

function setTheme(theme){
    document.documentElement.setAttribute('data-bs-theme', theme);
    saveTheme(theme);
    setThemeBtnState();
}

function setThemeBtnState(){
    lightModeBtn.classList.toggle('hide');
    darkModeBtn.classList.toggle('hide');
}

function saveTheme(theme){
    localStorage.setItem('SCT', theme);
}

function loadTheme(){
    theme = 'light';
    if (localStorage.getItem('SCT')){
        theme = localStorage.getItem('SCT');
        if(theme == 'dark'){
            setThemeBtnState();
        }
    }
    setTheme(theme);
}

navigate('views/users/home');

loadTheme();