import React, { useState, useEffect } from 'react';

// NOTE: The 'react-push-notification' library has been removed.
// We will use the browser's native Notification API for local feedback.

const categories = [
 {
   id: "weekly_report",
   name: "Wochenbericht",
   description: "Latest news in technology and innovation.",
   txt: "Ihr Wochenrückblick aus dem Rathaus! Jeden Freitag erhalten Sie unseren Wochenbericht kompakt zusammengefasst, was die Verwaltung diese Woche im Ort bewegt hat.",
 },
 {
   id: "townhall_news",
   name: "Rathaus Aktuell",
   description: "Announcements for our new products.",
   txt: "Hier erhalten Sie alle allgemeinen Informationen aus der Verwaltung. Wir informieren Sie über Schließtage, geänderte Öffnungszeiten, bevorstehende Gemeinderatssitzungen und mehr.",
 },
 {
   id: "emergencies",
   name: "Notfälle",
   description: "Exclusive discounts and promotions.",
   txt: "Dieser Kanal ist für wichtige Informationen im Notfall oder bei Katastrophen. Ob Unwetterwarnungen, Hochwasser oder andere akute Gefahren.",
 },
 {
   id: "closures_and_disruptions",
   name: "Sperrungen & Störungen",
   description: "Updates and news from our team.",
   txt: "Hier gibt es aktuelle Meldungen zur öffentlichen Versorgung und zum Verkehr. Sofortige Infos zu Straßensperrungen, wichtigen Baustellen und anderen Beeinträchtigungen.",
 },
 {
   id: "events",
   name: "Veranstaltungen",
   description: "A roundup of the weeks best content.",
   txt: "Was ist diese Woche los in Laaber? Jeden Montag liefern wir Ihnen die Veranstaltungen für die kommende Woche!",
 },
];

const OneSignal = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isOneSignalInitialized, setIsOneSignalInitialized] = useState(false);
  const [permission, setPermission] = useState('default');

  // Effect to initialize OneSignal and load saved category
  useEffect(() => {
    // Check for Notification API support
    if (!("Notification" in window)) {
      console.error("This browser does not support desktop notification");
    } else {
        setPermission(Notification.permission);
    }
      
    // Function to load the OneSignal SDK script
    const loadOneSignalSDK = () => {
      const script = document.createElement('script');
      script.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
      script.async = true;
      script.onload = () => {
        // Use window.OneSignal as it's loaded globally
        const OneSignal = window.OneSignal || [];
        OneSignal.push(function() {
          OneSignal.init({
            // IMPORTANT: Replace with your actual OneSignal App ID from your dashboard
            appId: "02d12db1-1701-46b8-b7ec-4d8b39fcbf99", 
            allowLocalhostAsSecureOrigin: true,
          });
          
          OneSignal.on('subscriptionChange', function(isSubscribed) {
              console.log("The user's subscription state is now:", isSubscribed);
          });
          
          OneSignal.on('notificationPermissionChange', function(permissionChange) {
            var currentPermission = permissionChange.to;
            console.log('New permission state:', currentPermission);
            setPermission(currentPermission);
          });

          setIsOneSignalInitialized(true);
        });
      };
      document.head.appendChild(script);
    };

    loadOneSignalSDK();

    // Load saved category from localStorage on component mount
    const savedCategory = localStorage.getItem('userSelectedCategory');
    if (savedCategory) {
      setSelectedCategory(savedCategory);
    }

  }, []); // Empty dependency array ensures this runs only once on mount

  // This function handles the logic when a user selects a category
  const handleCategorySelect = (category) => {
    console.log("Selected category:", category.name);

    // Update state and localStorage
    setSelectedCategory(category.id);
    localStorage.setItem('userSelectedCategory', category.id);

    // Send a local, in-browser notification to confirm the change using the native Notification API
    if (permission === 'granted') {
      new Notification(`Kategorie geändert: ${category.name}`, {
          body: category.txt,
          tag: 'category-change-notification' // Tag prevents multiple notifications from stacking
      });
    }

    // Tag the user in OneSignal for segmentation
    if (isOneSignalInitialized) {
        const OneSignal = window.OneSignal;
        const tagsToRemove = categories.map(c => c.id);

        // CORRECTED: Use the array-based command syntax for SDK methods
        // This queues the commands correctly instead of executing them in a problematic scope.
        console.log("Queuing removal of tags:", tagsToRemove);
        OneSignal.push(["removeTags", tagsToRemove]);

        console.log(`Queuing sending of tag: ${category.id}`);
        OneSignal.push(["sendTag", category.id, "true"]);

    } else {
        console.warn("OneSignal SDK not initialized yet. Cannot send tag.");
    }
  };
  
  const handleSubscribeClick = () => {
      const OneSignal = window.OneSignal;
      if (isOneSignalInitialized && OneSignal) {
          OneSignal.push(function() {
              console.log('Showing prompt to subscribe.');
              OneSignal.showSlidedownPrompt();
          });
      }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 mb-2">Benachrichtigungen verwalten</h1>
          <p className="text-lg text-gray-300">Wählen Sie eine Kategorie, um relevante Benachrichtigungen zu erhalten.</p>
        </header>

        {permission !== 'granted' && (
             <div className="bg-yellow-800 bg-opacity-50 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-lg relative mb-6 text-center">
                <strong className="font-bold block">Achtung!</strong>
                <span className="block sm:inline"> Benachrichtigungen sind nicht aktiviert. Klicken Sie hier, um sie zu abonnieren.</span>
                <button 
                    onClick={handleSubscribeClick} 
                    className="mt-2 sm:mt-0 sm:ml-4 inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                    Abonnieren
                </button>
             </div>
        )}

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategorySelect(category)}
              className={`
                p-6 rounded-xl border-2 cursor-pointer transition-all duration-300
                ${selectedCategory === category.id 
                  ? 'bg-cyan-900 border-cyan-400 shadow-lg shadow-cyan-500/20' 
                  : 'bg-gray-800 border-gray-700 hover:border-cyan-500 hover:bg-gray-700'}
              `}
            >
              <h2 className="text-2xl font-semibold text-cyan-400 mb-3">{category.name}</h2>
              <p className="text-gray-300">{category.txt}</p>
              {selectedCategory === category.id && (
                  <div className="mt-4 text-sm font-bold text-green-400">
                    ✓ Aktiviert
                  </div>
              )}
            </div>
          ))}
        </main>
        
        <footer className="text-center mt-10 text-gray-500 text-sm">
            <p>Powered by OneSignal</p>
        </footer>
      </div>
    </div>
  );
};

export default OneSignal;
