
const __MAIN_API_URL = "https://api.openweathermap.org/data/2.5/onecall"
const __MAIN_CITY_API_URL = "https://api.openweathermap.org/data/2.5/weather";
const __API_KEY = "84e93e078a44ae65c7d01a4dd7227a82";
const __DEFAULT_NUMBER_OF_VIEWS_FOR_HISTORY = 1;

const __WEATHER_ICONS = {
	rainy: "https://img.icons8.com/ultraviolet/2x/rain.png",
	cloudy: "https://img.icons8.com/office/2x/fog-day.png",
	clouds: "https://img.icons8.com/office/2x/cloud.png",
	noImage: "https://img.icons8.com/ios-filled/2x/no-image.png"
}

const __app_get_weather_data = ({lat, lon, exclude, appId}) => {
	let urlConfig = `${__MAIN_API_URL}`;
	let added = false;
	if (lat && lon) {
		urlConfig = `${urlConfig}?lat=${lat}&lon=${lon}`
		added = true;
	}
	if (exclude && Array.isArray(exclude) && exclude.length > 0) {
		const tokens = exclude.join(',');
		if (added) {
			urlConfig = `${urlConfig}&exclude=${tokens}`
		} else {
			urlConfig  = `${urlConfig}?exclude=${tokens}`;
			if (!added) {
				added = true;
			}
		}
	}
	if (appId) {
		if (added) {
			urlConfig = `${urlConfig}&units=metric&appid=${appId}`
		} else {
			urlConfig = `${urlConfig}&units=metric?appid=${appId}`
		}
	}
	return fetch(urlConfig);
}

const __setup_app_core_styles = () => {
	const jumbotron = document.getElementById("app-main-jumbotron");
	jumbotron.style.backgroundImage =
		"url('https://image.freepik.com/free-photo/dark-floor-background-black-empty-space-display-your-products-black-concrete-surface-ground-texture_36051-547.jpg')";
}

const __clear_all_weather_data = () => {
	if (window.confirm("You sure to clear all weather data ?")) {
		window.localStorage.removeItem("weather_vcs");
		// window.alert("All data cleared");

		// Trigger VCS UI view update
		__update_VCS_UI_on_app();
	}
}

const computeDate = (timestamp, dayNumFromNow) => {
	const currDate = new Date(timestamp);
	currDate.setDate(currDate.getDate() + dayNumFromNow);
	return currDate;
}

const __setup_core_weather_data_view = (weatherData) => {
	const coreWeatherViewRoot = document.getElementById("weather-core-data-view");
	document.getElementById("data-load-error").classList.add("d-none");

	const daysWeatherData = weatherData.data['daily'].map((day, idx) => (`
		<div class="col-sm-12 col-md-6">
			<div class="card text-dark bg-white mb-3 one-edge-shadow">
			    <div class="card-header">
			        <h5 class="card-title">Mainly ${day['weather'][0]['main']}, ${day['weather'][0]['description']}</h5>
			        <span class="card-subtitle text-muted">${(computeDate(weatherData.timestamp, idx+1)).toDateString()}</span>
				</div>
			    <div class="card-body">
					<h6>Temperature ... </h6>
					<span class="badge badge-secondary">
			            evening: ${day['temp']['eve']}&deg;C
					</span>
			        <span class="badge badge-info ml-1">
			            morning: ${day['temp']['morn']}&deg;C
					</span>
					<span class="badge badge-primary ml-1">
			            day: ${day['temp']['day']}&deg;C
					</span>
					<span class="badge badge-dark ml-1">
			            night: ${day['temp']['night']}&deg;C
					</span>
					<span class="badge badge-warning ml-1">
			            evening: ${day['temp']['eve']}&deg;C
					</span>
					<span class="badge badge-info ml-1">
			            min: ${day['temp']['min']}&deg;C
					</span>
					<span class="badge badge-info ml-1">
						max: ${day['temp']['max']}&deg;C
					</span>
			    </div>
			    <div class="card-footer">
			        <h6>Feels Like ...</h6>
			        <span class="badge badge-secondary">
			            Due point: ${day['dew_point']}&deg;C
					</span>
			        <span class="badge badge-info ml-1">
			            Humidity: ${day['humidity']}%
					</span>
					<span class="badge badge-primary ml-1">
			            Day: ${day['feels_like']['day']}&deg;C
					</span>
					<span class="badge badge-dark ml-1">
			            night: ${day['feels_like']['night']}&deg;C
					</span>
					<span class="badge badge-warning ml-1">
			            evening: ${day['feels_like']['eve']}&deg;C
					</span>
					<span class="badge badge-info ml-1">
			            morning: ${day['feels_like']['morn']}&deg;C
					</span>
				</div>
			</div>
		</div>
	`)).join('');

	coreWeatherViewRoot.innerHTML = (`
		<div class="row">
			<div class="col-sm-12">
				<div class="jumbotron one-edge-shadow p-2 text-white" style="background-color: #000000">
					<h2 class="text-center">
						<span class="badge badge-dark">${weatherData.data['current']['temp']}<sup>&deg;</sup>C</span>
						<span class="ml-2 small font-italic">${weatherData.data['timezone']}</span>
						<br/>
					</h2>
					<h5 class="text-center">
						<span class="small-font">
							Feels like ${weatherData.data['current']['feels_like']}<sup>&deg;</sup>C,
							${weatherData.data['current']['weather'][0]['description']}
						</span>
					</h5>
					<h6 class="text-center">
						<small>
							Latitude: ${weatherData.data['lat']} | Longitude: ${weatherData.data['lon']}
					    </small>
					</h6>
				</div>
				<h5 class="card-title font-weight-bold">${weatherData.data['daily'].length}-day Forecast</h5>
				<hr/>
				<div class="row">
					${daysWeatherData}	
				</div>
				
			</div>
		</div>
	`);
}

const __init_storage = () => {
	const weather_VCS = window.localStorage.getItem("weather_vcs");

	if (!weather_VCS) {
		const new_weather_VCS =  {
			all_location_data: [],
			all_city_data: [],
			history_view_count: __DEFAULT_NUMBER_OF_VIEWS_FOR_HISTORY,
		};
		// Create new 'DB' or 'VCS'
		window.localStorage.setItem("weather_vcs", JSON.stringify(new_weather_VCS));
	}
}


// Persist all weather data for each fetch

const __persist_weather_data = (data) => {
	// We use the windows local storage to persist data
	// We store it by current date (with seconds to make it distinct)
	// We make our own VCS (version control system), where we keep track
	// of date fetched and the time it was fetched

	const weather_VCS = window.localStorage.getItem("weather_vcs");
	const newData = {
		timestamp: (new Date()).toJSON(),
		data: data
	};

	if (!weather_VCS) {
		const new_weather_VCS =  {
			all_location_data: [newData],
			all_city_data: [],
			history_view_count: __DEFAULT_NUMBER_OF_VIEWS_FOR_HISTORY,
		};
		// Create new 'DB' or 'VCS'
		window.localStorage.setItem("weather_vcs", JSON.stringify(new_weather_VCS));
	} else {
		const weather_VCS_obj = JSON.parse(weather_VCS);

		weather_VCS_obj.history_view_count = __DEFAULT_NUMBER_OF_VIEWS_FOR_HISTORY;
		weather_VCS_obj.all_location_data = [newData, ...weather_VCS_obj.all_location_data];
		window.localStorage.setItem("weather_vcs", JSON.stringify(weather_VCS_obj));
	}
}

// Handle CSS styles when mouse is over a VCS history item.

const __handle_VCS_mouse_enter = function (vcs_idx, idx) {
	document.getElementById(vcs_idx).classList.add("bg-dark", "text-white");
	const imgElem = document.getElementById(`vcs-img-${idx}`);
	imgElem.classList.add("bg-white");
	imgElem.style.borderRadius = "5px";
	imgElem.style.padding =  "2px";
}

// Handle CSS styles when mouse is moved over a VCS history item.

const __handle_VCS_mouse_leave = function (vcs_idx, idx) {
	const elem = document.getElementById(vcs_idx);
	elem.classList.remove("bg-dark", "text-white");
	const imgElem = document.getElementById(`vcs-img-${idx}`);
	imgElem.classList.remove("bg-white");
	imgElem.style.borderRadius = "";
	imgElem.style.padding =  "";
}

// Chang weather view to that of a specific data fetched at a
// particular point in time

const __handle_VCS_full_list_group_item_view = function (vcs_id, dataIdx) {
	// window.alert(`You've just clicked -- data #${vcs_id}`);

	const weatherData_Obj = JSON.parse(window.localStorage.getItem("weather_vcs")).all_location_data[dataIdx];

	//console.log("Clicked weather data:", weatherData_Obj);
	__setup_core_weather_data_view(weatherData_Obj);
}

const __handle_load_more_history = () => {

	// When user wants to view more history data, we display 2 more history set at
	// a time (per click)

	const weatherData_Obj = JSON.parse(window.localStorage.getItem("weather_vcs"));
	weatherData_Obj.history_view_count += __DEFAULT_NUMBER_OF_VIEWS_FOR_HISTORY;

	// Save updated settings for weather app view
	window.localStorage.setItem("weather_vcs", JSON.stringify(weatherData_Obj));

	// Trigger VCS view 'refresh'. This will automatically setup the VCS to use new settings.
	__update_VCS_UI_on_app();

}

// Show the list group based on the weather data persisted

const __update_VCS_UI_on_app = () => {
	const weather_VCS = window.localStorage.getItem("weather_vcs");
	if (!weather_VCS) {
		const _VCS_UI_view = document.getElementById("__VCS_UI_history_view");
		_VCS_UI_view.innerHTML = `
			<div class="alert one-edge-shadow bg-dark text-white text-center 
					small text-uppercase font-weight-bold p-4 app-sticky">
				No Weather history data (based on your location) to show.
			</div>
		`
	} else {

		const _VCS_UI_view = document.getElementById("__VCS_UI_history_view");

		const weather_VCS_obj = JSON.parse(weather_VCS);
		const history_view_cnt = weather_VCS_obj.history_view_count;

		const __create_list_items = () => {
			return weather_VCS_obj.all_location_data.slice(0, history_view_cnt).map((vcsData, idx) => {
				return `
					<a id="vcs-${idx}" href="javascript:void(0)" class="list-group-item list-group-item-action 
								 flex-column align-items-start"
						onmouseenter="__handle_VCS_mouse_enter('vcs-${idx}', ${idx})"
						onmouseleave="__handle_VCS_mouse_leave('vcs-${idx}', ${idx})"
						onclick="__handle_VCS_full_list_group_item_view('vcs-${idx}', ${idx})">
						<div class="d-flex w-100 justify-content-between border-bottom-dark">
							<h6 class="">
								<img id="vcs-img-${idx}" src="https://img.icons8.com/fluent-systems-regular/2x/user-location.png" alt=""
									width="20" height="18"/>
								<span>${vcsData.data['timezone']}</span> |
								<span class="ml-1 badge badge-dark">${vcsData.data['current']['temp']}<sup>&deg;</sup>C</span>
							</h6>
							
						</div>
						<div class="">
							<div class="mt-1 mb-2">Weather is mainly ${vcsData['data']['current']['weather'][0]['description']}</div>
							<h6 class="small">
								Sunrise at <span class="font-weight-bold">
									${(new Date(vcsData.data['current']['sunrise'])).toLocaleDateString()}
								</span> | 
								Sunset at <span class="font-weight-bold">
									${(new Date(vcsData.data['current']['sunset'])).toLocaleDateString()}
								</span>
							</h6>
						</div>
						<small class="float-left">
							Latitude: ${vcsData.data['lat']} | Longitude: ${vcsData.data['lon']}
					    </small>
					    <br/>
					    <div class="mt-1">
							<small class="p-1 pl-2 pr-2 bg-dark text-white small text-center" style="border-radius: 8px">
								<span>Saved on </span>${(new Date(vcsData.timestamp)).toLocaleDateString()}
										at ${(new Date(vcsData.timestamp)).toLocaleTimeString()}
							</small>
						</div>
					</a>
				`
			// })[0];
			}).join('');
		}

		// Create all list items to be added to list group of
		// previous data fetched.

		const _all_VCS_html_data = __create_list_items();

		_VCS_UI_view.innerHTML = `
			<div class="app-sticky">
				<div class="jumbotron one-edge-shadow p-3 mb-2" style="background-color: #000000">
					<div class="container">
						<div class="row">
							<div class="col-12">
								<h6 class="font-weight-bold text-center mt-2 text-white text-uppercase">
							        <span class="badge badge-light">your coordinates based history data</span>
								</h6>
							</div>
						</div>
						<div class="text-center">
							<span class="text-center text-white small mt-0">
								${weather_VCS_obj.all_location_data.length} data collection found								
							</span>
						</div>
						<button class="btn btn-danger btn-sm btn-block mt-2"
							onclick="__clear_all_weather_data()">
							<kbd>clear all weather history</kbd>	
						</button>
					</div>
				</div>
<!--				<div class="row mb-2">-->
<!--					<div class="col-sm-6">-->
<!--						<button class="btn btn-dark btn-block">Do something</button>-->
<!--					</div>-->
<!--					<div class="col-sm-6">-->
<!--						<button class="btn btn-danger btn-block">Clear all data</button>-->
<!--					</div>-->
<!--				</div>-->
				<hr/>
				<div class="list-group one-edge-shadow">
					${_all_VCS_html_data}
				</div>
				<hr/>
				
			    ${history_view_cnt < weather_VCS_obj.all_location_data.length ? (`
			    	<button class="btn btn-dark btn-sm btn-block font-weight-bold p-2 font-weight-bold one-edge-shadow"
							onclick="__handle_load_more_history()"
							>
						Load more history
					</button>
			    `) : `<div/>`}
			</div>
		`
	}
}

const __persist_city_weather_data = (cityData, timestamp) => {
	// Create new city data
	const newCityData = {
		cityData: cityData,
		timestamp: timestamp
	};

	const weather_VCS = window.localStorage.getItem("weather_vcs");
	let weather_VCS_Obj = JSON.parse(weather_VCS);

	// Add new city data
	if (!weather_VCS_Obj) {
		weather_VCS_Obj =  {
			all_location_data: [],
			all_city_data: [newCityData],
			history_view_count: __DEFAULT_NUMBER_OF_VIEWS_FOR_HISTORY,
		};
	} else {
		weather_VCS_Obj.all_city_data = [newCityData, ...weather_VCS_Obj.all_city_data];
	}

	// Persist new city data
	window.localStorage.setItem("weather_vcs", JSON.stringify(weather_VCS_Obj));
}

const __getImage = (status) => {
	if (status.indexOf("rain") >= 0) {
		return __WEATHER_ICONS.rainy;
	} else if (status.indexOf("cloudy") >= 0) {
		return __WEATHER_ICONS.cloudy;
	} else if (status.indexOf("cloud") >= 0) {
		return __WEATHER_ICONS.clouds;
	} else {
		return __WEATHER_ICONS.noImage;
	}
}

const __clear_all_city_data = () => {

	if (window.confirm("Sure to clear all city history ?")) {
		// Obtain current records of all data for the UI
		const weather_VCS_Obj = JSON.parse(window.localStorage.getItem("weather_vcs"));

		// Clear all city data.
		weather_VCS_Obj.all_city_data = [];

		// Update the location storage with modified data.
		window.localStorage.setItem("weather_vcs", JSON.stringify(weather_VCS_Obj));

		// Update the UI to show changes
		__update_UI_with_city_data();
	}
}

const __update_UI_with_city_data = () => {

	document.getElementById("data-load-error").classList.add("d-none");
	const weather_VCS_Obj = JSON.parse(window.localStorage.getItem("weather_vcs"));

	const cityWeatherCards = weather_VCS_Obj.all_city_data.map((cityCoreData) => {
		let {cityData, timestamp} = cityCoreData;
		timestamp = new Date(timestamp);

		return (`
			<div class="col-sm-6">
				<div class="card one-edge-shadow text-white bg-dark mb-3">
					<div class="card-header">
						<div class="card-title">
							<div class="row">
								<div class="col-sm-6">
									<h5>
										${cityData['name']} at <span class="badge badge-primary ml-1">${cityData['main']['temp']}&deg;C</span>
									</h5>
								</div>
								<div class="col-sm-6">
									<span class="badge badge-light float-right small">
										${timestamp.toLocaleString()}
									</span>
								</div>
							</div>
							
							
						</div>
					</div>
				    <div class="card-body">
						<div class="text-center mt-0">
							<img alt="weather image" width="100" height="100" src="${__getImage(cityData['weather'][0]['main'].toLowerCase())}"/>
						</div>
						<div class="text-center font-weight-bold">
							Weather is mainly ${cityData['weather'][0]['main'].toLowerCase()}, ${cityData['weather'][0]['description']} 
						</div>
					</div>
					<div class="card-footer">
					   <span class="badge badge-secondary">country: ${cityData['sys']['country']}</span>
					   <span class="badge badge-warning">Longitude: ${cityData['coord']['lon']}</span>
					   <span class="badge badge-warning">Latitude: ${cityData['coord']['lat']}</span>
					   <span class="badge badge-light">Base: ${cityData['base']}</span>
					 </div>
				</div>
			</div>
		
		`)
	}).join('');


	document.getElementById("weather-core-data-view").innerHTML = (`
		<div>
			${weather_VCS_Obj.all_city_data.length > 0 ? (`
				<button class="btn btn-danger btn-sm one-edge-shadow font-weight-bold"
					onclick="__clear_all_city_data()">
					clear all city search history data
				</button>
				<hr/>
				<div class="row">
					${cityWeatherCards}
				</div>
			`) : (`
				<div class="container">
					<div class="alert alert-dark text-center small-font font-weight-light one-edge-shadow">
						Please search for city to get weather info or click on the 
						location history list on your left to view current weather 
						information base on your current location.
					</div>
				</div>
			`)}
		</div>
	`);
}

function __perform_search_by_city() {

	const inputElem = document.getElementById("city-name");
	const cityName = inputElem.value;
	if (cityName.length === 0) {
		window.alert("Please enter search value");
	} else {

		// disable input search field
		inputElem.setAttribute('disabled', 'disabled');

		// disable search button
		this.setAttribute("disabled", "disabled");


		document.getElementById("loader-div").classList.remove("d-none");
		const elem = document.getElementById("loading-state-info")
		elem.innerHTML = `Searching for <b>${cityName}</b> ...`
		elem.classList.remove("d-none");

		fetch(`${__MAIN_CITY_API_URL}?q=${cityName}&units=metric&appid=${__API_KEY}`)
			.then((response) => {

				document.getElementById("loader-div").classList.add("d-none");
				document.getElementById("loading-state-info").classList.add("d-none");

				// enable input search field
				inputElem.removeAttribute('disabled');

				// enable search button
				this.removeAttribute("disabled");

				if (response.status === 404) {
					window.alert(`City '${cityName}' could not be found`);
				} else if (response.status === 200) {

					response.json()
						.then((data) => {

							// Persist new data we've found
							//__persist_weather_data(data);
							//
							// // Update the UI
							// __update_VCS_UI_on_app();

							//
							// // setup main view
							// __setup_core_weather_data_view(data);
							
							__persist_city_weather_data(data, new Date());

							__update_UI_with_city_data();

						})
				} else {
					window.alert("[UNKNOWN ERROR OCCURRED]");
				}
			});
	}
}

const showPosition = (position) => {
	
	let loadInitialData = true;

	// Check to see if there was previous data in history
	// if (!weather_VCS) {
	//
	// 	// Since there isn't any data, we setup the application to
	// 	// fetch default data based on user's location (longitude and
	// 	// latitude.
	// 	loadInitialData = true;
	// }
	//loadInitialData = true;

	let userLat = position.coords.latitude;
	let userLon = position.coords.longitude;

	// Here the web app had been loaded, so we make a data fetch (first data fetch)
	// Only when there wasn't any data in the history.

	const loadInfoElem = document.getElementById("loading-state-info")

	if (loadInitialData) {
		loadInfoElem.innerText = "Loading your location data ...";
		__app_get_weather_data({lat: userLat, lon: userLon, appId: __API_KEY})
			.then((response) => {

				if (response.status !== 200) {
					document.getElementById("data-load-error").classList.remove("d-none");
					document.getElementById("error-msg").innerText = response.statusText
				} else {
					document.getElementById("loader-div").classList.add("d-none");
					// Re-enable (show) input view
					document.getElementById("search-input-view").classList.remove("d-none");

					// console.log("[DATA_REQUEST_SUCCESS]:", response);
					response.json()
						.then((data) => {


							// console.log("data:", data)

							// Persist new data we've found
							__persist_weather_data(data);

							// Update the VCS UI for locations
							__update_VCS_UI_on_app();

							// Update the UI with previous city searches
							__update_UI_with_city_data();


						})
						.catch((error) => {


							// console.log("new error:", error)
						});
				}
			})
			.catch((error) => {
				document.getElementById("loader-div").classList.add("d-none");
				document.getElementById("data-load-error").classList.remove("d-none");
				document.getElementById("error-msg").innerText = error.message
			});
	} else {
		document.getElementById("loader-div").classList.add("d-none");
		// Re-enable (show) input view
		document.getElementById("search-input-view").classList.remove("d-none");

	}
}

window.onload = function () {

	// Setup styles for the application UI.
	__setup_app_core_styles();

	// Update UI to show previous data (history) if any
	__update_VCS_UI_on_app();

	__init_storage();

	// Setup search by city
	document.getElementById("city-name-search").addEventListener("click", __perform_search_by_city);

	// Hide search bar and button view, available only when the geolocation service
	// is accepted and other settings made for the application
	document.getElementById("search-input-view").classList.add("d-none");

	const loadingInfoElem = document.getElementById("loading-state-info");
	loadingInfoElem.innerText = "Setting up geolocation service ..."


	// if user has geolocation setup, we use it to get weather data
	if (navigator.geolocation) {

		navigator.geolocation.getCurrentPosition(showPosition, () => {

			// In case user refused to give us access to his/her location
			// we use default location data

			const position = {
				coords: {
					latitude: 0,
					longitude: 0
				}
			}

			//showPosition(position)
			__update_UI_with_city_data();

			// Hide loader
			document.getElementById("loader-div").classList.add("d-none");

			document.getElementById("search-input-view").classList.remove("d-none");

		});
	} else {

		// window.alert("You just refused")
		//
		// // dummy position
		// const position = {
		// 	coords: {
		// 		latitude: 0,
		// 		longitude: 0
		// 	}
		// }
		// showPosition(position);


	}

}