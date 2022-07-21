function test_field(value, field) {
  let reg;
  switch(field){
    case "name":
      reg = /^[a-zA-Z]{1,20}$/;
      break;
    case "email":
      reg = /^.{1,25}@alamana\.org\.ma$/;
      break;
    case "pass":
      reg = /^.{8,40}$/;
      break;
    case "resp":
      reg = /^.{1,50}$/;
      break;
    case "phone":
      reg = /^[0-9]{10}$/;
      break;
  }
  return reg.test(value); 
}

function validate_fields(){
  let warn = document.getElementById("warn")
  let submitbtn = document.getElementById("submitbtn")

  let f_name = document.getElementById("f_name").value
  let l_name = document.getElementById("l_name").value
  if (!(test_field(f_name, 'name') && test_field(l_name, 'name'))){
    warn.innerHTML = "The first name and last name must be each between 1-20 letters." 
    warn.removeAttribute("hidden");
    submitbtn.setAttribute("disabled", true);
    return;
  }

  let email = document.getElementById("email").value
  if (!test_field(email, 'email')){
    warn.innerHTML = "The email must be in the following format <strong>example@alamana.org.ma</strong>." 
    warn.removeAttribute("hidden");
    submitbtn.setAttribute("disabled", true);
    return;
  }

  let pass = document.getElementById("pass").value
  if (!test_field(pass, 'pass')){
    warn.innerHTML = "The password must be between 8-40 characters long." 
    warn.removeAttribute("hidden");
    submitbtn.setAttribute("disabled", true);
    return;
  }

  let resp = document.getElementById("resp").value
  if (!test_field(resp, 'resp')){
    warn.innerHTML = "The responsability must be between 1-50 characters long." 
    warn.removeAttribute("hidden");
    submitbtn.setAttribute("disabled", true);
    return;
  }

  let phone = document.getElementById("phone").value
  if (!test_field(phone, 'phone')){
    warn.innerHTML = "The phone number should be 10 digits." 
    warn.removeAttribute("hidden");
    submitbtn.setAttribute("disabled", true);
    return;
  }

  warn.setAttribute("hidden", true);
  submitbtn.removeAttribute("disabled");
} 
validate_fields()
