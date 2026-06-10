# Travel-Planner
Travel Planner is an interactive web application for discovering and organizing travel destinations. Developed by a team of Erasmus+ students as a final project for the "Problem Solving" course.
# Travel Planner

Travel Planner is an interactive web application developed for the **Problem Solving** course. The main goal of the project is to help users search for attractions and places in a selected city, view basic information about them, and create a personal trip list. The application is built with **HTML, CSS, and JavaScript** and runs locally without a backend.

## Project Description

The application allows users to search for travel places by entering a city name. After the search, the app displays a list of places such as tourist attractions, restaurants, entertainment areas, museums, and parks. Each result includes the place name, category, distance information, and a map option.

Users can add places to their personal **My Trip List**, remove them later, and sort the list by name or category. The trip list is saved in **LocalStorage**, so the selected places remain available even after refreshing the page.

## Main Features

* Search for places by city name
* Display results with place name, category, address, and distance
* Add places to a personal trip list
* Remove places from the trip list
* Save the trip list using LocalStorage
* Sort the trip list by name or category
* Filter search results by category
* Sort results by distance
* Add custom places manually with input validation
* View place details in a modal window
* Open place location on Google Maps
* Display an embedded map using Leaflet.js and OpenStreetMap
* Use LocalStorage cache for recently searched cities
* Basic unit tests for important functions

## Technologies Used

* HTML5
* CSS3
* JavaScript
* Fetch API
* LocalStorage
* Geoapify Places API
* OpenStreetMap / Nominatim API
* Leaflet.js
* Wikipedia API for additional place details

## APIs Used

### OpenStreetMap / Nominatim

Nominatim is used to convert the city name entered by the user into geographic coordinates. These coordinates are then used to search for nearby places.

### Geoapify Places API

Geoapify is used to fetch attractions, restaurants, parks, museums, and entertainment places around the selected city.

### Wikipedia API

Wikipedia API is used to provide a short description and image for some selected places when the user opens the details modal.

### Leaflet.js and OpenStreetMap

Leaflet.js is used to display an interactive map in the place details modal.

## Setup Instructions

1. Download or clone the project repository.

```bash
git clone <repository-link>
```

2. Open the project folder.

```bash
cd Travel-Planner
```

3. Open the `app.js` file.

4. Replace the API key placeholder with a valid Geoapify API key:

```javascript
const API_KEY = "YOUR_API_KEY_HERE";
```

5. Open `index.html` in a web browser.

No backend server is required. The project runs directly in the browser.

## How to Use the Application

1. Type a city name into the search bar.
2. Click the **Search** button.
3. Browse the list of places displayed in the results section.
4. Use the category filter to narrow down results.
5. Sort places by distance if needed.
6. Click **+ Add** to save a place to the trip list.
7. Use **Sort by Name** or **Sort by Category** to organize the trip list.
8. Click the remove button to delete a place from the trip list.
9. Add a custom place manually using the form in the trip list section.
10. Click **View on Map** to see more details and the map location.

## Design Decisions

The application was designed as a simple frontend-only project. This makes it easy to run locally without installing additional backend tools. The interface is divided into two main sections: search results on the left and the personal trip list on the right. This structure makes the app easy to understand and use.

LocalStorage was used for two purposes. First, it saves the user’s trip list permanently in the browser. Second, it stores recent search results as a simple cache. This reduces repeated API requests and helps with API rate limits.

The application uses a clean visual design with cards, panels, buttons, and toast notifications. Toast messages give quick feedback when users search, add a place, remove a place, or make an invalid action.

## Problem-Solving Approach

The project solves the problem of organizing travel ideas in a practical way. Instead of searching for attractions manually on different websites, users can search a city, view nearby places, and save selected locations in one trip list.

The implementation required several problem-solving steps:

* Getting city coordinates from a city name
* Fetching nearby places from an external API
* Filtering places by category
* Calculating distance from the city center
* Sorting places by distance
* Saving user selections in LocalStorage
* Preventing duplicate places in the trip list
* Validating custom place input
* Showing map and details in a modal window

## Testing

Basic unit tests were included in the JavaScript file. These tests check important application functions such as:

1. Duplicate protection in the trip list
2. Alphabetical sorting of trip list items
3. Distance-based sorting of places

The tests run automatically in the browser console after the application loads. They help verify that the main logic of the project works correctly.

## Project Structure

```text
Travel-Planner/
│
├── index.html      # Main HTML structure
├── style.css       # Styling and layout
├── app.js          # JavaScript logic and API integration
└── README.md       # Project description and setup instructions
```

## Limitations

The application depends on external APIs, so an internet connection is required for searching places and loading maps. Also, some places may not have detailed descriptions or images available from Wikipedia. In these cases, the app displays a fallback message.

The API key should not be shared publicly in a real production project. For academic use and local testing, the key can be placed in `app.js`, but for a public GitHub repository it is better to keep sensitive data private.

## Conclusion

Travel Planner is a simple but useful web application for discovering places and organizing a personal trip plan. It meets the main project requirements by using a public API, displaying search results, allowing users to add and remove places from a trip list, saving data in LocalStorage, and sorting the trip list. Additional features such as filtering, distance sorting, custom places, caching, map display, and basic tests improve the overall functionality of the project.
