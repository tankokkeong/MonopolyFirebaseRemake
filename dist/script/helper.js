const route = (page, param = "") => {
    if(param == ""){
        window.location.href = page + ".html";
    }
    else{
        window.location.href = page + ".html?" + param;
    }
};
