To finalize your **Sparkle Suite Master Doc**, you need a "Template" version of your code. For future reps, you will simply replace the **Web App URL** and the **Rep Name** in these master files.

Here are the two master files for your cheat sheet:

### ---

**📄 Master File 1: manifest.json**

*This is the configuration file that tells Chrome how the extension works. You can use this exact code for every rep.*

JSON

{  
  "manifest\_version": 3,  
  "name": "Sparkle Suite Sync Tool",  
  "version": "1.0",  
  "description": "Custom Live Queue Sync for Bomb Party Reps",  
  "permissions": \["scripting"\],  
  "host\_permissions": \[  
    "https://myoffice.bombparty.com/\*",   
    "https://script.google.com/\*"  
  \],  
  "content\_scripts": \[{  
    "matches": \["https://myoffice.bombparty.com/\*"\],  
    "js": \["content.js"\]  
  }\]  
}

### ---

**📄 Master File 2: content.js**

*This is the "Brain" of the operation. Use this template and update the two variables at the top for each new client.*

JavaScript

// \==========================================  
// 🛠️ CLIENT CONFIGURATION  
// \==========================================  
const CLIENT\_URL \= "PASTE\_NEW\_GOOGLE\_WEB\_APP\_URL\_HERE";  
const REP\_NAME \= "REP\_NAME\_HERE"; // e.g., "Mile High Fizz"

function runSparkleSync() {  
  const syncBtn \= document.getElementById("sparkle-sync-btn");  
    
  // Visual Feedback: Start Sync  
  if (syncBtn) {  
    syncBtn.innerHTML \= "⏳ Syncing...";  
    syncBtn.style.background \= "\#ffd1dc";   
    syncBtn.style.color \= "\#ff69b4";  
  }

  const rows \= document.querySelectorAll('table tr');  
  let pendingOrders \= \[\];

  rows.forEach((row) \=\> {  
    const cells \= row.querySelectorAll('td');  
    if (cells.length \>= 8) {  
      const firstName \= cells\[3\]?.innerText.trim();  
      const checkbox \= row.querySelector('input\[type="checkbox"\]');  
      const isAlreadyRevealed \= checkbox ? checkbox.checked : false;

      // Only grab people who have NOT been revealed  
      if (firstName && \!isAlreadyRevealed && firstName \!== "First Name") {  
        pendingOrders.push(firstName);  
      }  
    }  
  });

  // Put oldest orders at the top of the list  
  const chronologicalQueue \= pendingOrders.reverse();

  fetch(CLIENT\_URL, {  
    method: 'POST',  
    body: JSON.stringify({ names: chronologicalQueue }),  
    mode: 'no-cors'  
  }).then(() \=\> {  
    // Visual Feedback: Success\!  
    if (syncBtn) {  
      syncBtn.innerHTML \= \`✅ ${REP\_NAME} Updated\!\`;  
      syncBtn.style.background \= "\#4CAF50";   
      syncBtn.style.color \= "white";  
        
      setTimeout(() \=\> {  
        syncBtn.innerHTML \= \`✨ Sync ${REP\_NAME} Queue\`;  
        syncBtn.style.background \= "\#ff69b4";  
        syncBtn.style.color \= "white";  
      }, 3000);  
    }  
  });  
}

// 1\. Create the Master Sync Button  
const syncBtn \= document.createElement("button");  
syncBtn.id \= "sparkle-sync-btn";  
syncBtn.innerHTML \= \`✨ Sync ${REP\_NAME} Queue\`;  
syncBtn.style \= "position:fixed;bottom:30px;right:30px;z-index:9999;padding:15px 25px;background:\#ff69b4;color:white;border:none;border-radius:50px;cursor:pointer;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.3);transition: all 0.3s ease;";  
syncBtn.onclick \= runSparkleSync;  
document.body.appendChild(syncBtn);

// 2\. Auto-Sync every 2 minutes  
setInterval(runSparkleSync, 120000);

// 3\. Refresh Dashboard page every 2 minutes to catch new orders  
setInterval(() \=\> {  
  window.location.reload();  
}, 120000); 

// Initial trigger on load  
setTimeout(runSparkleSync, 3000);

### ---

**💡 How to use this for your next client:**

1. **Phase 1:** Get their unique Google Script URL.  
2. **Phase 2:** Paste that URL into CLIENT\_URL in the content.js template.  
3. **Phase 3:** Update the REP\_NAME so the button on their dashboard looks professional.

**Would you like me to create a "Client Hand-off Email" template so you can professionally deliver these files and instructions to your next rep?**