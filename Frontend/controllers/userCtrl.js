async function registration(){
    let name = document.querySelector('#name');
    let email = document.querySelector('#email');
    let passwd = document.querySelector('#passwd');
    let confirm = document.querySelector('#confirm');

    // meg kell szolitani a servert

    const response = await fetch('https://localhost:3000/admin/users');

    const data = await response.json();

    console.log(data);
}