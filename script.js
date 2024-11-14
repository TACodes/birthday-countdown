const countdownList = document.getElementById("countdown-list");
// let deleteRequest = indexedDB.deleteDatabase("birthdays");
const openRequest = indexedDB.open("birthdays", 1);

openRequest.onerror = function() {
  console.error("Error ", openRequest.error);
};

openRequest.onupgradeneeded = function(event) {
  let db = event.target.result;
  if (!db.objectStoreNames.contains("dates")) { 
    db.createObjectStore("dates");
  }
};

openRequest.onsuccess = function(event) {
  let db = event.target.result;

  let transaction = db.transaction("dates", "readwrite");
  let dates = transaction.objectStore("dates");

  const birthdaysRequest = dates.getAll();

  birthdaysRequest.onsuccess = function(event){
    let storedBirthdays = event.target.result;
    storedBirthdays.forEach(birthday => {
      addBirthdayToPage(birthday.name, birthday.date);
    });
  }

  birthdaysRequest.onerror = function(event){
    console.log("There is an error while fetching birthdays ", event.target.errorCode);
  }

  transaction.onerror = function(event) {
    console.log("Transaction not opened due to error. ", event.target.result);
  };

  transaction.oncomplete = function() {
    console.log("Transaction is complete in openRequest");
  };
};


function addBirthday() {
    const name = document.getElementById("nameInput").value;
    const date = document.getElementById("dateInput").value;

    if (name && date) {
        // Save the new birthday to localStorage
        saveBirthdayToIndexedDB(name, date);
        
        // Add the birthday to the page
        addBirthdayToPage(name, date);
    }
}

function addBirthdayToPage(name, date) {
    const countdownItem = document.createElement("div");
    countdownItem.className = "countdown-item";
    
    const updateCountdown = () => {
        const daysLeft = calculateDaysUntilBirthday(new Date(date));
        countdownItem.innerHTML = `<strong>${name}'s birthday:</strong> ${daysLeft}`;
    };
    
    // Initial update and display
    updateCountdown();

    // Set the next update at midnight
    scheduleMidnightUpdate(updateCountdown);

    // Create the delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function () {
      deleteBirthday(name, countdownItem);
    };

    // Append the delete button to the countdown item
    countdownItem.appendChild(deleteButton);

    countdownList.appendChild(countdownItem);
}

function scheduleMidnightUpdate(callback) {
    // Calculate time until midnight
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // Midnight of the next day

    const timeUntilMidnight = nextMidnight - now;

    // First update at midnight, then every 24 hours
    setTimeout(() => {
        callback();
        setInterval(callback, 86400000); // 86400000 ms = 24 hours
    }, timeUntilMidnight);
}

function calculateDaysUntilBirthday(birthdayDate) {
    const now = new Date();
    
    // Set the birthday to the current year
    birthdayDate.setFullYear(now.getFullYear());
    
    // If today is the birthday, show special message
    if (isSameDay(now, birthdayDate)) {
        return "Hooray! It's their birthday today! 🎉";
    }

    // If the birthday has passed this year, set it for the next year
    if (now > birthdayDate) {
        birthdayDate.setFullYear(now.getFullYear() + 1);
    }

    // Calculate days left
    const timeDifference = birthdayDate - now;
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    
    return `${daysDifference} days left`;
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

// Function to save a birthday to localStorage
function saveBirthdayToIndexedDB(name, date) {
  let db = openRequest.result;
  let transaction = db.transaction("dates", "readwrite");
  let dates = transaction.objectStore("dates");
  let request = dates.put({name, date}, name);

  request.onsuccess = function() {
    console.log("Date added to the store");
  };
    
  request.onerror = function(event) {
    console.error("Error ", event.target.result);
  };

  transaction.oncomplete = function() {
    console.log("Transaction is complete");
  };
}

function deleteBirthday(name, countdownItem) {
  // Remove from IndexedDB
  let db = openRequest.result;
  let transaction = db.transaction("dates", "readwrite");
  let dates = transaction.objectStore("dates");
  let deleteRequest = dates.delete(name);

  deleteRequest.onsuccess = function () {
      console.log(`${name}'s birthday deleted from IndexedDB`);
      
      // Remove the item from the DOM
      countdownList.removeChild(countdownItem);
  };

  deleteRequest.onerror = function (event) {
      console.error("Error deleting entry from IndexedDB", event.target.errorCode);
  };
}
