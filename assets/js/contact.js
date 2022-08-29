function btnSubmit() {
    let name = document.querySelector('#name').value;
    let email = document.querySelector('#email').value;
    let phone = document.querySelector('#phone').value;
    let subject = document.querySelector('#subject').value;
    let message = document.querySelector('#message ').value;
    let err = document.querySelectorAll('.style');
    let anchor = document.createElement('a');
    anchor.href = `mailto:kevin.falah@gmail.com?subject=${subject}&body=Halo Saya ${name}, ${message}. ${email} | ${phone}`;

    err.forEach((e) => {
        let txt = document.createElement('p');
        let txtValue = document.createTextNode('*Kolom Wajib Diisi');
        txt.appendChild(txtValue);
        txt.style.color = 'red';
        txt.style.marginBottom = '10px';
        txt.style.marginTop = '-5px';
        if(e.value == "") {
            e.after(txt)        
            setTimeout(() => {
             location.reload();
            }, 1300);
        }
        setTimeout(() => {
            anchor.click();
        },2000) 
    });

}