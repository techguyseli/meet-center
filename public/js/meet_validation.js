function test_title(value) {
  var reg = /^.{1,50}$/
  return reg.test(value)
}

function test_desc(value){
  var reg = /^.{0,300}$/;
  return reg.test(value)
}

function test_dates(start_d, end_d){
  var now = new Date()
  return (start_d - end_d < 0 && start_d > now)
}

function validate_fields(){
  var warn = document.getElementById("warn")
  var submitbtn = document.getElementById("submitbtn")
  var title = document.getElementById("title").value
  if (!test_title(title)){
    warn.innerHTML = "The title must be between 1-50 characters." 
    warn.removeAttribute("hidden");
    submitbtn.setAttribute("disabled", true);
    return;
  }
  var desc = document.getElementById("desc").value
  if (!test_desc(desc)){
    warn.innerHTML = "The description can't be more than 300 characters." 
    warn.removeAttribute("hidden");
    submitbtn.setAttribute("disabled", true);
    return;
  }
  var start_d = new Date(document.getElementById("start_d").value)
  var end_d = new Date(document.getElementById("end_d").value)
  if (!test_dates(start_d, end_d)){
    warn.innerHTML = "The start date and time must be before the end date and time, it should also come after the current time (e.g. after right now)." 
    warn.removeAttribute("hidden");
    submitbtn.setAttribute("disabled", true);
    return;
  }
  warn.setAttribute("hidden", true);
  submitbtn.removeAttribute("disabled");
} 
validate_fields()
