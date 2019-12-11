var APIKEY = "7b3907a7cb937fc3f2ef582dcb6ab200";
var searchKeywords = new Array();
var localStorageKey = "lskeywords";

init();
function init(){
    var city = getLastSearchedCity();
    console.log(city);
    // city is empty when history localStorage is empty. 
    if (city == "empty") {
        console.log("city undefined");
        searchByGeoLocation();
    } else {
        getCurrentWeather(city, null, null);
        getFiveDaysFocast(city, null, null);
        renderSearchKeywords();    
    }
}

function getLastSearchedCity() {
    // var city = "Sydney";// City to display by default
    var city = "empty";
    searchKeywords = JSON.parse(localStorage.getItem(localStorageKey));
    if (Array.isArray(searchKeywords) && searchKeywords.length > 0) {
        // When searchKeywords is null, error occurs at this line.
        city = searchKeywords[searchKeywords.length - 1];
    } 
    return city;
}

function renderSearchKeywords() {
    // console.log("renderSearchKeywords");
    searchKeywords = JSON.parse(localStorage.getItem(localStorageKey));
    // console.log(searchKeywords);
    if (Array.isArray(searchKeywords) && searchKeywords.length > 0) {
        // When searchKeywords is null, error occurs at this line.
        var ul = $("<ul>");
        ul.addClass("list-group list-group-flush");
        $("#previousSearchKeywords").append(ul);
        var ulEl = $("#previousSearchKeywords ul");
        for (var i = searchKeywords.length - 1; i >= 0; i--) {
            //console.log(searchKeywords[i]);
            var li = $("<li>");
            li.addClass("list-group-item city-list");
            li.text(searchKeywords[i]);
            ulEl.append(li);
        }
    }
};

// When a search history is clicked, search again. 
$("#previousSearchKeywords").on("click", ".city-list", function () {
    // Event binding on dynamically created elements
    // https://stackoverflow.com/questions/203198/event-binding-on-dynamically-created-elements
    //console.log($(this).text());
    var city = $(this).text();
    clear();
    $("#searchTxt").val(city);
    getCurrentWeather(city, null, null);
    getFiveDaysFocast(city, null, null);
    addCityToLocalStorage(city)
});

// Perform search when Enter key pressed
$("#searchTxt").on("keypress", function () {
    //console.log(event);
    if (event.keyCode == 13) {
        searchWeather();
    }
});

// Perform search when search button is clicked
$("#searchBtn").on("click", searchWeather);
function searchWeather() {
    var city = $("#searchTxt").val().trim();
    console.log(city);
    // console.log("searchKeywords: ", searchKeywords);
    clear();
    getCurrentWeather(city, null, null);
    getFiveDaysFocast(city, null, null);
    addCityToLocalStorage(city);
};

// Perform search based on current location when location button is clicked
$("#locationBtn").on("click", searchByGeoLocation);

function searchByGeoLocation(){
    // console.log("locatinBtn clicked");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(searchByGeoLocationHandler, showError);
    } else { 
        $("#errorMessage").text("Geolocation is not supported by this browser.");
    }
};

function searchByGeoLocationHandler(position) {
    console.log("Latitude: " + position.coords.latitude + "  Longitude: " + position.coords.longitude);
    clear();
    getCurrentWeather(null, position.coords.latitude, position.coords.longitude);
    getFiveDaysFocast(null, position.coords.latitude, position.coords.longitude);
};

function showError(error) {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        $("#errorMessage").text("User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        $("#errorMessage").text("Location information is unavailable.");
        break;
      case error.TIMEOUT:
        $("#errorMessage").text("The request to get user location timed out.");
        break;
      case error.UNKNOWN_ERROR:
        $("#errorMessage").text("An unknown error occurred.");
        break;
    }
};

function addCityToLocalStorage(city){
    console.log("addCityToLocalStorage");
    if (Array.isArray(searchKeywords) && searchKeywords.length > 0) {
        // TODO: Implement ignore case
        var pos = searchKeywords.indexOf(city); 
        console.log("pos:", pos);
        // If same city name exists in localStorage, remove it before adding the new one.
        if (pos !== -1){
            searchKeywords.splice(pos,1); // Remove duplicate
        }
        searchKeywords.push(city);
        localStorage.setItem(localStorageKey, JSON.stringify(searchKeywords));
    } else {
        //console.log(searchKeywords);
        var skw = [];
        skw[0] = city;
        localStorage.setItem(localStorageKey, JSON.stringify(skw));
    }
    renderSearchKeywords();
}

function clear() {
    // Clear today's weather
    $("#todayCity").empty();
    $("#todayTemp").empty();
    $("#todayHumidity").empty();
    $("#todayWind").empty();
    $("#todayUV").empty();

    // Clear 5 days forcast 
    for (var day = 1; day < 6; day++) {
        $("#" + day + "day").empty();
        $("#" + day + "dayIcon").empty();
        $("#" + day + "dayTemp").empty();
        $("#" + day + "dayHumidity").empty();
    }
    // Clear search history
    $("#previousSearchKeywords").empty();
}

function getCurrentWeather(city, lat, lon) {
    //console.log("getCurrentWeather");
    var queryWeatherURL;
    var searchByCity = false;
    if (city!==null) { 
        searchByCity = true;
        queryWeatherURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + APIKEY;
    } else if ( lat!==null && lon !== null ){
        searchByCity = false;
        queryWeatherURL = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid=" + APIKEY;
    } 
    //console.log(queryWeatherURL);
    $.ajax({
        url: queryWeatherURL,
        method: "GET"
    }).then(function (response) {
        //console.log("Weather JSON: ", response);
        var city = response.name;
        // Kelvin to Fahrenheit: F = (K - 273.15) * 1.80 + 32
        // Kelvin to Celsius: C = 0K -273.15
        var ktemp = response.main.temp;
        //var ftemp =  (ktemp - 273.15) * 1.80 + 32;
        var ctemp = Math.floor(ktemp - 273.15);
        var weather = response.weather[0].description;
        var icon = response.weather[0].icon;
        var iconURL = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
        var humidity = response.main.humidity;
        var wind = response.wind.speed;
        var longitude = response.coord.lon;
        var latitude = response.coord.lat;
        var gmtEpoc = response.dt;
        var timezone = response.timezone; // unit is second
        var formattedLocalDate = getFormattedLocalDate(gmtEpoc, timezone);

        // console.log("City: ", city);
        // console.log("Weather: ", weather);
        // console.log("Icon: ", icon);
        // console.log("IconURL: ", iconURL);
        // console.log("Celsius: ", ctemp, "C");
        // console.log("Humidity: ", humidity, "%");
        // console.log("Wind Speed: ", wind, " m/s");
        // console.log("Longitude: ", longitude);
        // console.log("Latitude: ", latitude);
        // console.log("GMT Epoc: ", gmtEpoc);
        // console.log("Timezone: ", timezone);
        // console.log("formattedLocalDate: ", formattedLocalDate);

        // Query for UV
        var queryUvURL = "https://api.openweathermap.org/data/2.5/uvi?appid=" + APIKEY + "&lat=" + latitude + "&lon=" + longitude;
        // console.log(queryUvURL);

        $.ajax({
            url: queryUvURL,
            method: "GET",
            aync: false
        }).then(function (response) {
            //console.log("UV JSON: ", response);
            var uv = response.value;
            //console.log("UV: " + uv);
            renderTodayWeather(city, formattedLocalDate, iconURL, ctemp, humidity, wind, uv);
        });

        // Update history if searched by location 
        if (searchByCity==false) { 
            addCityToLocalStorage(city);
        }
    })
}

function getFormattedLocalDate(gmtEpoc, timezone) {
    var localTime = moment.unix(gmtEpoc).utcOffset(timezone / 60);
    // var formattedLocalTime = localTime.format("DD/MM/YYYY HH:MM");
    var formattedLocalDate = localTime.format("DD/MM/YYYY");
    // console.log(formattedLocalDate);
    return formattedLocalDate;
};

function renderTodayWeather(city, formattedLocalDate, iconURL, ctemp, humidity, wind, uv) {
    $("#todayCity").text(city + " (" + formattedLocalDate + ")");
    var img = $("<img>");
    $("#todayCity").append(img);
    img.attr("src", iconURL);
    img.attr("height", "80px")

    $("#todayTemp").text(ctemp);
    $("#todayHumidity").text(humidity);
    $("#todayWind").text(wind);
    $("#todayUV").text(uv);
};

function getFiveDaysFocast(city, lat, lon) {
    var queryFocastURL;
    if (city !== null) { 
        queryFocastURL = "https://api.openweathermap.org/data/2.5/forecast?appid=" + APIKEY + "&q=" + city;
    } else if (lat !== null && lon !== null) {
        queryFocastURL = "https://api.openweathermap.org/data/2.5/forecast?appid=" + APIKEY + "&lat=" + lat + "&lon=" + lon;       
    }

    console.log(queryFocastURL);
    $.ajax({
        url: queryFocastURL,
        method: "GET"
    }).then(function (response) {
        //console.log("Focast JSON: ", response);

        var city = response.city.name;
        // Kelvin to Fahrenheit: F = (K - 273.15) * 1.80 + 32
        // Kelvin to Celsius: C = 0K -273.15

        var day = 0;
        for (var i = 4; i < response.list.length; i = i + 8) {
            var ktemp = response.list[i].main.temp;
            var ctemp = Math.floor(ktemp - 273.15);
            var weather = response.list[i].weather[0].description;
            var icon = response.list[i].weather[0].icon;
            var iconURL = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
            var humidity = response.list[i].main.humidity;
            var gmtEpoc = response.list[i].dt;
            var timezone = response.city.timezone;
            var formattedLocalDate = getFormattedLocalDate(gmtEpoc, timezone);

            // console.log([i] + "---------------------")
            // console.log("City: ", city)
            // console.log("Weather: ", weather);
            // console.log("IconURL: ", iconURL);
            // console.log("Celsius: ", ctemp, "C");
            // console.log("Humidity: ", humidity, "%");
            // console.log("GMT Epoc: ", gmtEpoc);
            // console.log("Timezone: ", timezone);
            // console.log("formattedLocalDate: ", formattedLocalDate);
            day = day + 1;
            renderFocast(day, formattedLocalDate, iconURL, ctemp, humidity);
        }
    });
};

function renderFocast(day, formattedLocalDate, iconURL, ctemp, humidity) {
    $("#" + day + "day").text(formattedLocalDate);
    var img = $("<img>");
    $("#" + day + "dayIcon").append(img);
    img.attr("src", iconURL);
    img.attr("height", "60px")
    $("#" + day + "dayTemp").text(ctemp);
    $("#" + day + "dayHumidity").text(humidity);
};

