const APP = {
  //api for testing purposes
  baseURL: "https://giftr.mad9124.rocks",
  //baseURL: "http://127.0.0.1:3030",
  //TODO: update the key for session storage
  OWNERKEY: "giftr-<${}>-owner",
  owner: null,
  user: null,
  GIFTS: [],
  PEOPLE: null,
  PID: null,
  PNAME: null,
  token: null,
  init() {
    //init the sw on the APP
    //APP.swInit();

    console.log("App initialized");
    //run the pageLoaded function
    APP.pageLoaded();
    //add UI listeners
    APP.addListeners();
  },
  swInit() {
    //the function to handle the sw registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", {
          updateViaCache: "none",
          scope: "/",
        })
        .then((reg) => {
          APP.sw = reg.installing || reg.waiting || reg.active;
          console.log("service worker registered");
        });
      if (navigator.serviceWorker.controller) {
        console.log("we have a service worker installed");
      }
      navigator.serviceWorker.oncontrollerchange = (ev) => {
        console.log("New service worker activated");
      };
      //listening for service worker messages event
      navigator.serviceWorker.addEventListener("message", (ev) => APP.onMessage);
      //remove/unregister service workers that are not active
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (let reg of regs) {
          if (!reg.active) {
            reg.unregister().then((isUnreg) => console.log(isUnreg));
          }
        }
      });
    } else {
      console.log("Service workers are not supported.");
    }
  },
  pageLoaded() {
    //page has just loaded and we need to check the queryString
    //based on the querystring value(s) run the page specific tasks
    console.log("A page is loaded and checking", location.search);
    let params = new URL(document.location).searchParams;
    //figure out what page we are on... use this when building content
    APP.page = document.body.id;
    switch (APP.page) {
      case "home":
        //do things for the home page
        //check for the ?out and clear out the user's session info
        //TODO: this check for logged in should be done through API and token
        if (params.has("in")) {
          //TODO: if we're loggedIn , fetch data to the api, to find if the user is loggedIn
        }
        //TODO: clear out old tokens when the user logs out
        if (params.has("out")) {
          APP.owner = null;
          APP.GIFTS = [];
          APP.PEOPLE = [];
          APP.PID = null;
          APP.PNAME = null;
          //delete the cookie
          document.cookie = "";
        }
        break;
      case "people":
        //do things for the people page
        APP.getOwner().getPeople();
        break;
      case "gifts":
        //do things for the gifts page
        APP.PID = params.get("pid");
        APP.getOwner().getGifts();
        break;
    }
  },
  getOwner() {
    let id = sessionStorage.getItem(APP.OWNERKEY);
    if (id) {
      APP.owner = id;
      return APP;
    } else {
      if (APP.token) {
        console.log("token is available:", APP.token);
        //certifying the user is actually logged in,
        //if yes, validating the identity again
        APP.APIToken();
        APP.getOwner();
      } else {
        console.log("token not available, logging out the user");
        //if no token is attached to the session, logging the user out
        location.href = "/index.html?out";
      }
    }
  },
  APIToken() {
    //API token validation function
    let token = document.cookie;

    let opts = {
      method: "GET",
      headers: new Headers({
        Authorization: "Bearer " + token,
        "x-api-key": "gil00013",
      }),
    };

    fetch(APP.baseURL + "/auth/users/me", opts)
      .then(
        (resp) => {
          if (resp.ok) return resp.json();
          throw new Error(resp.statusText);
        },
        (err) => {
          //failed to fetch data
          console.warn({ err });
        }
      )
      .then(({ data }) => {
        console.log("this is the data received from the api: ", data);
        //handling the received logged in user data
        //saving the user info on session Storage
        sessionStorage.setItem(APP.OWNERKEY, data._id);
        APP.owner = data._id;
        //navigating to the people's page with the logged-in data
        location.href = `/people.html?owner=${APP.owner}`;
      })
      .catch((err) => {
        console.log(err);
      });
  },
  APILogin() {
    //function to handle login requests on the API
    let email = document.getElementById("email_login").value;
    email = email.trim();

    let password = document.getElementById("password_login").value;
    password = password.trim();

    let data = {
      email: email,
      password: password,
    };

    let opts = {
      method: "POST",
      headers: new Headers({
        "x-api-key": "gil00013",
        "Content-type": "application/json",
      }),
      body: JSON.stringify(data),
    };

    if (email) {
      let url = APP.baseURL + "/auth/tokens";
      fetch(url, opts)
        .then(
          (resp) => {
            if (resp.ok) return resp.json();
            //saving the token for future uses
            throw new Error(resp.statusText);
          },
          (err) => {
            //failed to fetch user
            console.warn({ err });
          }
        )
        .then(({ data }) => {
          //saving the token in a cookie for future use
          document.cookie = data.token;
          console.log("the logged-in token is: ", APP.token);
          //calling the function to validate the token
          APP.APIToken();
        })
        //DO a global error handling function
        .catch((err) => console.log("error fetching the data: ", err));
    } else {
      console.log("no e-mail address found");
    }
  },
  APIRegister() {
    const firstName = document.getElementById("first_name").value;
    const lastName = document.getElementById("last_name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const registerInfo = { firstName, lastName, email, password };
    //console.log(registerInfo);
    const registerAPI = APP.baseURL + "/auth/users";
    const option = {
      method: "POST",
      headers: {
        "x-api-key": "gil00013",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerInfo),
    };
    fetch(registerAPI, option)
      .then((res) => res.json())
      .then((resultData) => console.log(resultData))
      .catch((error) => console.log(error));
    console.log(registerAPI);
    // after successfully register a user, should then log in the user.
  },
  addListeners() {
    console.log(APP.page, "adding listeners");
    //HOME PAGE
    if (APP.page === "home") {
      let btnReg = document.getElementById("btnRegister");
      btnReg.addEventListener("click", (ev) => {
        //logging in and validating the user
        APP.APIRegister();
        //go to people page after login success
        console.log("registered... go to people page");
        //location.href = '/proj4-pwa-starter/people.html';
      });

      let btnLogin = document.getElementById("btnLogin");
      btnLogin.addEventListener("click", (ev) => {
        ev.preventDefault();
        //calling the API function
        APP.APILogin();
        console.log("logged in... go to people page");
      });
    }

    //PEOPLE PAGE
    if (APP.page === "people") {
      //activate the add person modal
      let elemsP = document.querySelectorAll(".modal");
      let instancesP = M.Modal.init(elemsP, { dismissable: true });
      //activate the slide out for logout
      let elemsL = document.querySelectorAll(".sidenav");
      let instancesL = M.Sidenav.init(elemsL, {
        edge: "left",
        draggable: true,
      });
      //activate modal for deleting person
      let elemsD = document.querySelectorAll(".modal");
      let instancesD = M.Modal.init(elemsD);

      //add person listener
      let btnSave = document.getElementById("btnSavePerson");
      btnSave.addEventListener("click", APP.addPerson);

      let section = document.querySelector(`section.people`);
      section.addEventListener("click", APP.delOrViewPerson);
      //stop form submissions
      document.querySelector("#modalAddPerson form").addEventListener("submit", (ev) => {
        ev.preventDefault();
      });
    }

    //GIFTS PAGE
    if (APP.page === "gifts") {
      //activate the add gift modal
      let elemsG = document.querySelectorAll(".modal");
      let instancesG = M.Modal.init(elemsG, { dismissable: true });
      //activate the slide out for logout
      let elemsL = document.querySelectorAll(".sidenav");
      let instancesL = M.Sidenav.init(elemsL, {
        edge: "left",
        draggable: true,
      });

      //add gift listener
      let btnSave = document.getElementById("btnSaveGift");
      btnSave.addEventListener("click", APP.addGift);
      //TODO:
      //delete gift listener TODO: Add confirmation for delete
      let section = document.querySelector(`section.gifts`);
      section.addEventListener("click", APP.delGift);
      //stop form submissions
      document.querySelector("#modalAddGift form").addEventListener("submit", (ev) => {
        ev.preventDefault();
      });
    }
  },
  delGift(ev) {
    ev.preventDefault();
    console.log(ev.target);
    let btn = ev.target;
    if (btn.classList.contains("del-gift")) {
      let id = btn.closest(".card[data-id]").getAttribute("data-id");
      //TODO: remove from DB by calling API
      APP.GIFTS = APP.GIFTS.filter((gift) => gift._id != id);
      APP.buildGiftList();
    }
  },
  delOrViewPerson(ev) {
    ev.preventDefault(); //stop the anchor from leaving the page
    console.log(ev.target);
    let btn = ev.target;
    if (btn.classList.contains("del-person")) {
      //opening the modal
      //activate modal for deleting person
      let delModal = document.querySelector("#modalDelPerson");
      let instance = M.Modal.getInstance(delModal);
      instance.open();
      //if user clicked yes, delete person from db
      document.querySelector("#delYes").addEventListener("click", () => {
        //delete a person
        let id = btn.closest(".card[data-id]").getAttribute("data-id");
        //Calling the API to delete the person
        //retrieving jwt for validation
        let jwt = document.cookie;

        let opts = {
          method: "DELETE",
          headers: new Headers({
            Authorization: "Bearer " + jwt,
            "x-api-key": "gil00013",
            "Content-type": "application/json",
          }),
        };

        fetch(APP.baseURL + "/api/people/" + id, opts)
          .then(
            (resp) => {
              if (resp.ok) return resp.json();
              throw new Error(resp.statusText);
            },
            (err) => {
              //failed to fetch data
              console.warn({ err });
            }
          )
          .then((data) => {
            console.log(data);
            //updating the page
            APP.buildPeopleList();
            location.reload();
          });
      });
    }
    if (btn.classList.contains("view-gifts")) {
      console.log("go view gifts");
      //go see the gifts for this person
      let id = btn.closest(".card[data-id]").getAttribute("data-id");
      //we can pass person_id by sessionStorage or queryString or history.state ?
      let url = `/gifts.html?owner=${APP.owner}&pid=${id}`;
      location.href = url;
    }
  },
  addPerson(ev) {
    //user clicked the save person button in the modal
    ev.preventDefault();
    let name = document.getElementById("name").value;
    let dob = document.getElementById("dob").value;
    let birthDate = new Date(dob).valueOf();
    if (name.trim() && birthDate) {
      console.log(name, dob);
      //fetching data and saving onto the api

      let person = {
        name,
        birthDate,
        gifts: [],
        owner: APP.owner,
      };
      //retrieving the current jwt token from the cookies
      let jwt = document.cookie;

      let opts = {
        method: "POST",
        headers: new Headers({
          Authorization: "Bearer " + jwt,
          "x-api-key": "gil00013",
          "Content-type": "application/json",
        }),
        body: JSON.stringify(person),
      };

      fetch(APP.baseURL + "/api/people", opts)
        .then(
          (resp) => {
            if (resp.ok) return resp.json();
            throw new Error(resp.statusText);
          },
          (err) => {
            //failed to fetch data
            console.warn({ err });
          }
        )
        .then((data) => {
          console.log("this is the new user: ", data);
          //updating the interface
          APP.buildPeopleList();
          location.reload();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  },
  addGift(ev) {
    //user clicked the save gift button in the modal
    let btnSave=document.querySelector('#btnSaveGift');
    btnSave.classList.toggle('modal-close')
    let field = {
    "name": document.getElementById("name").value,
    "price": document.getElementById("price").value,
    "storeName": document.getElementById("storeName").value,
    "storeProductURL": document.getElementById("storeProductURL").value
    }
    //if there is an empty field, disabling the send button
    for (var key in field) {
      if (field[key] === ""){
        console.log("empty field")
        let btnSave = document.querySelector("#btnSaveGift")
        btnSave.classList.remove('modal-close')
      }
    }
    //TODO: check for valid URL if provided
    //TODO: provide error messages to user about invalid prices and urls
    if (name.trim() && !isNaN(price) && storeName.trim()) {
      let gift = {
        _id: Date.now(),
        name,
        price,
        store: {
          name: storeName,
          productURL: storeProductURL,
        },
      };
      //add the gift to the current person
      //TODO: Actually send this to the API instead of just updating the array
      APP.GIFTS.push(gift);
      APP.buildGiftList();
      document.querySelector(".modal form").reset();
    }
  },
  sendMessage(msg, target) {
    //TODO:
    //send a message to the service worker
  },
  onMessage({ data }) {
    //TODO:
    //message received from service worker
  },
  buildPeopleList: () => {
    //build the list of cards inside the current page's container
    let container = document.querySelector("section.row.people>div");
    if (container) {
      //TODO: add handling for null and undefined or missing values
      if (APP.PEOPLE.length !== 0) {
        document.querySelector('#no_people').innerHTML= "";
        container.innerHTML = APP.PEOPLE.map((person) => {
          let dt = new Date(parseInt(person.birthDate)).toLocaleDateString("en-CA");
          //console.log(dt);
          return `<div class="card person" data-id="${person._id}">
          <div class="card-content light-green-text text-darken-4">
            <span class="card-title">${person.name}</span>
            <p class="dob">${dt}</p>
          </div>
          <div class="fab-anchor">
            <a href="#modalDelPerson" class="modal-trigger btn-floating halfway-fab red del-person"
              ><i class="material-icons del-person">delete</i></a
            >
          </div>
          <div class="card-action light-green darken-4">
            <a href="/proj4-pwa-starter/gifts.html" class="view-gifts white-text"
              ><i class="material-icons">playlist_add</i> View Gifts</a
            >
          </div>
        </div>`;
        }).join("\n");
      } else {
        //TODO: error message
      }
        
      }
    },
    buildGiftList: () => {
    let container = document.querySelector("section.row.gifts>div");
    if (container) {
      //get the name of the person to display in the title
      let a = document.querySelector(".person-name a");
      a.textContent = APP.PNAME;
      a.href = `/people.html?owner=${APP.owner}`;
      //displaying a message on the screen if there no gifts
      if (APP.GIFTS.length == 0) {
        console.log('no gifts available, show message')
        let message = document.querySelector("#no_gifts")
        message.innerHTML = "There are no gifts to display for this person"
      }

      container.innerHTML = APP.GIFTS.map((gift) => {
        //TODO: add handling for null and undefined or missing values
        //TODO: check for a valid URL before setting an href
        let url = gift.store.productURL;
        try {
          url = new URL(url);
          urlStr = url;
        } catch (err) {
          if (err.name == "TypeError") {
            //not a valid url
            url = "";
            urlStr = "No valid URL provided";
          }
        }
        return `<div class="card gift" data-id="${gift._id}">
            <div class="card-content light-green-text text-darken-4">
              <h5 class="card-title idea">
                <i class="material-icons">lightbulb</i> ${gift.name}
              </h5>
              <h6 class="price"><i class="material-icons">paid</i> ${gift.price}</h6>
              
              <h6 class="store">
                <i class="material-icons">room</i>${gift.store.name}</h6>
              </h6>
              <h6 class="link">
                <i class="material-icons">link</i>
                <a href="${url}" class="" target="_blank"
                  >${urlStr}</a
                >
              </h6>
            </div>
            <div class="fab-anchor">
              <a class="btn-floating halfway-fab red del-gift"
                ><i class="material-icons del-gift">delete</i></a
              >
            </div>
          </div>`;
      }).join("\n");
    } else {
      //TODO: error message
    }
  },
  getPeople() {
    //this function returns the list of people for the logged in user.
    if (!APP.owner) return;
    let url = APP.baseURL + "/api/people/";

    let token = document.cookie;

    let opts = {
      method: "GET",
      headers: new Headers({
        Authorization: "Bearer " + token,
        "x-api-key": "gil00013",
      }),
    };

    fetch(url, opts)
      .then((resp) => resp.json())
      .then(({data}) => {
        console.log(data);
        APP.PEOPLE = data;
        APP.buildPeopleList();
      })
      .catch((err) => {
        //TODO: global error handler function
        console.warn({ err });
      });
  },

  getGifts() {
    //function to get the list of gifts for the person on the api
    if (!APP.owner) return;
    //getting the current token
    let token = document.cookie;
    let url = APP.baseURL + "/api/people/" + APP.PID;

    let opts = {
      method: "GET",
      headers: new Headers({
        Authorization: "Bearer " + token,
        "x-api-key": "gil00013",
      }),
    };

    fetch(url, opts)
      .then(
        (resp) => {
          if (resp.ok) return resp.json();
          throw new Error(resp.statusText);
        },
        (err) => {
          console.warn({ err });
        }
      )
      .then(({data}) => {
        console.log(data);
        APP.owner = data.owner;
        //matching the person ID with the query string and passing data
        //onto the global variables.
        APP.PID = data._id;
        APP.PNAME = data.name;
        APP.GIFTS = data.gifts;
        APP.buildGiftList();
      })
      .catch((err) => {
        //TODO: global error handler function
        console.warn({ err });
      });
  },
};

document.addEventListener("DOMContentLoaded", APP.init);
