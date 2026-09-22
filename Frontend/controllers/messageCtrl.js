function showMessage(type, title, msg) {
 let msgBox = document.querySelector('#msg');
 msgBox.innerHTML = `<div class="alert ${type} alert-dismissible fade show" role="alert">
  <strong>${title}</strong> <br>${msg}
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`
 setTimeout(() => {
     hideMessage();
 }, 3000);
}

function hideMessage() {
 let msgBox = document.querySelector('#msg');
 msgBox.innerHTML = '';
}