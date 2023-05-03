export const setCookie = (cname, cvalue, exdays) => {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export const getCookie = (cname) => {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

export const displayCustomMessage = (id, message) =>{
    var container = document.getElementById(id);
    container.innerHTML = message;
}

export const route = (page, param = "") => {
    if(param == ""){
        window.location.href = page + ".html";
    }
    else{
        window.location.href = page + ".html?" + param;
    }
};

export const getUrlParams = (paramName) => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    return urlParams.get(paramName);
}

export const getFormattedTimeStamp = () => {
    // Get Current Timestamp
    var date = new Date();

    var months_array = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Get hour and minute
    var hour = date.getHours();
	var minute= date.getMinutes();

    // Get date, month, and year
    var day = date.getDate(); 
    var month = months_array[date.getMonth()];
    var year = date.getFullYear();

    var formattedDate = month + " " +  day + " " + year;
    var formattedTime = checkTime(hour) + ":" + checkTime(minute);

    return formattedDate + ", " + formattedTime
}

export const getTimestamp = () => {
    // Get Current Timestamp
    var date = new Date();
    var timestamp = date.getTime();

    return timestamp;
};

export const setFormValue = (id, value) => {
    var form = document.getElementById(id);
    form.value = value;
}

function checkTime(i)
{
	if(i<10)
	{
		i="0"+i;
	}
	
	return i;
}