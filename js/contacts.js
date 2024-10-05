const CONTACTS_URL = "https://join-database-3d39f-default-rtdb.europe-west1.firebasedatabase.app/contacts/";

let contactsData = {};
let contactsArray = [];
let contactsKeys = [];
let isShowContactExecuted = false;

/**
 * This function initializes contacts.html with body onload.
 * @returns true
 */
async function contactsInit() {
  await fetchDataJson();
  createContactsList();
  generateInitials();
  return true;
}

/**
 * This function fetches all contact information from database and saves them as objects, array
 * and an array with the contact keys. Then it sorts the contacts and the keys, so that they
 * can be rendered in alphabetic order in the library.
 * @returns response
 */
async function fetchDataJson() {
  try {
    let response = await fetch(CONTACTS_URL + ".json");
    let responseToJson = await response.json();
    contactsData = responseToJson || {};
    contactsArray = Object.values(contactsData);
    contactsKeys = Object.keys(contactsData);
    const sortedContacts = contactsArray
      .map((contact, index) => ({ contact, key: contactsKeys[index] }))
      .sort((a, b) => a.contact.name.split(" ")[0].localeCompare(b.contact.name.split(" ")[0]));
    contactsArray = sortedContacts.map((item) => item.contact);
    contactsKeys = sortedContacts.map((item) => item.key);
  } catch (error) {
    console.error("Error fetching data:", error);
    return false;
  }
}

/**
 * This function generates the contact library and the letter directories.
 */
function createContactsList() {
  let content = document.getElementById("contacts-list");
  content.innerHTML = "";
  let currentLetter = "";

  for (let i = 0; i < contactsArray.length; i++) {
    let contact = contactsArray[i];
    let key = contactsKeys[i];
    let nameParts = contact.name.split(" ");
    let initials = nameParts[0][0] + nameParts[1][0];
    let firstLetter = nameParts[0][0].toUpperCase();

    currentLetter = addLetterSection(content, currentLetter, firstLetter);

    content.innerHTML += generateDirectory(key, initials, contact);
  }
}

/**
 * This function returns the bubbles in the contact list.
 * @param {string} content - ID of the list
 * @param {string} currentLetter 
 * @param {string} firstLetter 
 * @returns the bubbles in the contact list
 */
function addLetterSection(content, currentLetter, firstLetter) {
  if (firstLetter !== currentLetter) {
    currentLetter = firstLetter;
    content.innerHTML += `
            <div class="first-letter">${currentLetter}</div>
            <div class="line"></div>
        `;
  }
  return currentLetter;
}


/**
 * Standard function for posting new contacts onto database.
 * @param {string} path
 * @param {object} data
 * @returns response
 */
async function postData(path = "", data = {}) {
  try {
    let response = await fetch(CONTACTS_URL + path + ".json", {
      method: "POST",
      headers: {"Content-Type": "application/json",},
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error posting data:", error);
  }
}

/**
 * This function handles the adding of a new contact. It posts the contact onto database,
 * closes the layer and shows the contact information.
 */
async function addContact() {
  let name = document.getElementById("add-contact-name").value;
  let mail = document.getElementById("add-contact-mail").value;
  let phone = document.getElementById("add-contact-phone").value;
  let color = getRandomColor();

  let newContact = { email: mail, name: name, phone: phone, color: color };
  let postResponse = await postData("", newContact);

  let dataFetched = await contactsInit();
  if (dataFetched) {
    contactAdded(newContact);
  } else {
    console.error("Failed to fetch updated contact data.");
  }
}

/**
 * This function handles the actions if a new contact has been added successfully.
 * @param {object} newContact
 */
function contactAdded(newContact) {
  document.getElementById("add-contact-name").value = "";
  document.getElementById("add-contact-mail").value = "";
  document.getElementById("add-contact-phone").value = "";

  closeAddContactLayer();

  let newKey = Object.keys(contactsData).find((key) => contactsData[key].email === newContact.email && contactsData[key].name === newContact.name);
  let initials = newContact.name.split(" ")[0][0] + newContact.name.split(" ")[1][0];
  showContact(initials, newContact, newKey);
}

/**
 * Standard function for deleting a contact from database
 * @param {string} key - contact key
 */
async function deleteContact(key) {
  try {
    let response = await fetch(CONTACTS_URL + key + ".json", {
      method: "DELETE",
    });
    await response.json();
    await contactsInit();

    document.getElementById("contact-profile").innerHTML = "";
  } catch (error) {
    console.error("Error deleting contact:", error);
  }
}

/**
 * This function saves and shows an updated contact after editing it.
 */
async function saveContact() {
  let key = document.getElementById("edit-contact-key").value;
  let name = document.getElementById("edit-contact-name").value;
  let email = document.getElementById("edit-contact-mail").value;
  let phone = document.getElementById("edit-contact-phone").value;
  let currentContact = contactsData[key];
  let color = currentContact.color;
  let updatedContact = { email, name, phone, color };
  try {
    await updateContact(key, updatedContact);
    await contactsInit();
    closeEditContactLayer();
    displayUpdatedContact(name, updatedContact, key);
  } catch (error) {
    console.error("Error updating contact:", error);}
}

/**
 * This function shows the contact details after editing a contact.
 * @param {string} name 
 * @param {object} updatedContact 
 * @param {string} key 
 */
function displayUpdatedContact(name, updatedContact, key) {
  let initials = name.split(" ")[0][0] + name.split(" ")[1][0];
  showContact(initials, updatedContact, key);
}

/**
 * Standard function for putting an edited contact onto database.
 * @param {string} key -contact key
 * @param {object} updatedContact
 * @returns response
 */
async function updateContact(key, updatedContact) {
  try {
    let response = await fetch(CONTACTS_URL + key + ".json", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",},
      body: JSON.stringify(updatedContact),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating contact:", error);
    throw error;
  }
}

/**
 * This function shows the contact details when clicking on the contact in the library
 * or after adding or editing a contact.
 * @param {string} initials
 * @param {object} contact
 * @param {string} key - contact key
 */
function showContact(initials, contact, key) {
  highlightContact(key);
  let content = document.getElementById("contact-profile"),
    contentLibrary = document.getElementById("contacts-library");
  (content.innerHTML = ""), window.innerWidth <= 1120 ? contentLibrary.classList.add("d-none") : contentLibrary.classList.remove("d-none");
  content.classList.remove("slide-in-right"), void content.offsetWidth, content.classList.add("slide-in-right");
  (content.innerHTML += generateContactHTML(initials, contact, key)), (isShowContactExecuted = true);
}

/**
 * This function ensures that the content library is shown in the correct situations in responsive layout.
 */
window.addEventListener("resize", function () {
  let contentLibrary = document.getElementById("contacts-library");
  if (isShowContactExecuted) window.innerWidth > 1120 ? contentLibrary.classList.remove("d-none") : contentLibrary.classList.add("d-none");
});

/**
 * This function highlights a contact in the library when it is active.
 * @param {string} key - contact key
 */
function highlightContact(key) {
  let contacts = document.getElementsByClassName("contact");

  for (let j = 0; j < contacts.length; j++) {
    contacts[j].classList.remove("selected-contact");
  }

  let currentContact = document.getElementById(`contact${key}`);
  if (currentContact) {
    currentContact.classList.add("selected-contact");
  }
}

/**
 * This function animates and opens the add contact layer.
 */
function openAddContactLayer() {
  document.getElementById("add-contact-layer").classList.remove("d-none");
  let content = document.getElementById("add-contact-inner-layer");

  content.classList.remove("slide-in-right");
  content.classList.remove("slide-out-right");
  void content.offsetWidth;
  content.classList.add("slide-in-right");
}

/**
 * This function animates and opens the edit contact layer.
 * @param {string} key - contact key
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 */
function openEditContactLayer(key, name, email, phone) {
  document.getElementById("edit-contact-layer").classList.remove("d-none");
  let content = document.getElementById("edit-contact-inner-layer");

  content.classList.remove("slide-in-right");
  content.classList.remove("slide-out-right");
  void content.offsetWidth;
  content.classList.add("slide-in-right");

  document.getElementById("edit-contact-key").value = key;
  document.getElementById("edit-contact-name").value = name;
  document.getElementById("edit-contact-mail").value = email;
  document.getElementById("edit-contact-phone").value = phone;
}

/**
 * This function animates and hides the add contact layer.
 */
function closeAddContactLayer() {
  let contentLayer = document.getElementById("add-contact-layer");
  let content = document.getElementById("add-contact-inner-layer");

  content.classList.remove("slide-out-right");
  void content.offsetWidth;
  content.classList.add("slide-out-right");

  content.removeEventListener("animationend", handleAnimationEnd);
  content.addEventListener("animationend", handleAnimationEnd, { once: true });
}

/**
 * This function animates and hides the edit contact layer.
 */
function closeEditContactLayer() {
  let contentLayer = document.getElementById("edit-contact-layer");
  let content = document.getElementById("edit-contact-inner-layer");

  content.classList.remove("slide-out-right");
  void content.offsetWidth;
  content.classList.add("slide-out-right");

  content.removeEventListener("animationend", handleAnimationEnd);
  content.addEventListener("animationend", handleAnimationEnd, { once: true });
}

/**
 * This function only is responsible for hiding the add- and the edit contact layer.
 */
function handleAnimationEnd() {
  document.getElementById("add-contact-layer").classList.add("d-none");
  document.getElementById("edit-contact-layer").classList.add("d-none");
}

/**
 * This function chooses a random color for a new contact added. It is used then in every bubble
 * in every html.
 * @returns random color
 */
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}