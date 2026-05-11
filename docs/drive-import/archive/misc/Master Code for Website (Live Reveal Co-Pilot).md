I understand. Let’s strip out the technical labels and comments and give you just the functional "Master Code" you need to copy-paste into your website builder.

Here is the clean version of the **Master Website Component**. This code handles the automatic 60-second refresh and pulls the data from the dashboard sync.

### **📄 Master Website Code**

*Copy everything below and paste it into your Ready.ai code block.*

TypeScript

import React, { useState, useEffect } from 'react';

const SCRIPT\_URL \= "Phttps://script.google.com/macros/s/AKfycbxB18wAi01-Hu-lH2hPG3nvlBZjQvM6gu6-C6nx7LafoaPrlrCa-QX1kgh4a9MJZ9JoDg/exec";  
const REP\_NAME \= "Britt with Bling";  
const THEME\_COLOR \= "from-pink-500 to-purple-600"; 

interface QueueData {  
  queue: string\[\];  
  lastUpdated: string;  
}

export default function MasterLiveQueue() {  
  const \[data, setData\] \= useState\<QueueData\>({ queue: \[\], lastUpdated: "" });  
  const \[loading, setLoading\] \= useState(true);

  const fetchQueue \= async () \=\> {  
    try {  
      const response \= await fetch(SCRIPT\_URL);  
      const json \= await response.json();  
      setData(json);  
      setLoading(false);  
    } catch (error) {  
      console.error("Error:", error);  
      setLoading(false);  
    }  
  };

  useEffect(() \=\> {  
    fetchQueue();  
    const interval \= setInterval(() \=\> {  
      fetchQueue();  
    }, 60000);   
    return () \=\> clearInterval(interval);  
  }, \[\]);

  if (loading) {  
    return (  
      \<div className="p-10 text-center text-pink-500 animate-pulse font-bold bg-white rounded-3xl border border-pink-100"\>  
        Syncing with Dashboard...  
      \</div\>  
    );  
  }

  const currentlyRevealing \= data.queue\[0\];  
  const upNext \= data.queue.slice(1);

  return (  
    \<div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 font-sans"\>  
      \<div className={\`bg-gradient-to-r ${THEME\_COLOR} p-5 text-center\`}\>  
        \<h2 className="text-white font-black text-2xl tracking-tighter uppercase italic"\>  
          {REP\_NAME} Lineup  
        \</h2\>  
        \<p className="text-white/80 text-\[10px\] font-bold uppercase tracking-widest mt-1"\>  
          Last Synced: {data.lastUpdated || "Waiting..."}  
        \</p\>  
      \</div\>

      \<div className="p-8 text-center bg-white border-b border-gray-50"\>  
        \<div className="inline-block bg-gray-100 text-gray-500 text-\[10px\] font-black px-4 py-1 rounded-full uppercase mb-3"\>  
          Currently Unboxing  
        \</div\>  
        \<h3 className="text-5xl font-black text-gray-900 tracking-tight"\>  
          {currentlyRevealing || "Ready to Fizz\!"}  
        \</h3\>  
          
        {currentlyRevealing && (  
          \<div className="mt-4 flex justify-center items-center gap-2"\>  
            \<span className="relative flex h-3 w-3"\>  
              \<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"\>\</span\>  
              \<span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"\>\</span\>  
            \</span\>  
            \<span className="text-green-600 text-\[10px\] font-bold uppercase tracking-widest"\>Live on TikTok\</span\>  
          \</div\>  
        )}  
      \</div\>

      \<div className="p-5 bg-gray-50"\>  
        \<h4 className="text-\[10px\] font-bold text-gray-400 uppercase tracking-widest mb-4"\>Coming Up Next\</h4\>  
        \<div className="space-y-3"\>  
          {upNext.length \> 0 ? (  
            upNext.map((name, index) \=\> (  
              \<div key={index} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100"\>  
                \<div className="flex items-center gap-3"\>  
                  \<span className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded-full text-\[10px\] font-bold text-gray-400"\>  
                    {index \+ 1}  
                  \</span\>  
                  \<span className="font-extrabold text-gray-700"\>{name}\</span\>  
                \</div\>  
                \<span className="text-\[10px\] font-bold text-gray-200 uppercase"\>In Line\</span\>  
              \</div\>  
            ))  
          ) : (  
            \<p className="text-center text-gray-400 text-xs py-4 italic"\>The queue is currently empty\</p\>  
          )}  
        \</div\>  
      \</div\>  
        
      \<div className="p-4 bg-white text-center"\>  
        \<p className="text-\[9px\] text-gray-300 font-medium tracking-tight"\>  
          Powered by Sparkle Suite Automation • 2026  
        \</p\>  
      \</div\>  
    \</div\>  
  );  
}

### ---

**🔑 The "Fill in the Blanks" Key**

You only need to look at the **first few lines** of the code to set up a new rep. Change these three things:

1. **PASTE\_UNIQUE\_URL\_HERE**: Paste the new Google Script URL you created for the rep inside those quotes.  
2. **REP\_NAME\_HERE**: Type the rep's business name (like Mile High).  
3. **from-pink-500 to-purple-600**: These are the colors. If you have a different color for a new client, I can give you the specific code for their brand.

**Since you're scaling this up, would you like me to show you how to change that "theme color" line to match specific brands like teal, gold, or blue?**