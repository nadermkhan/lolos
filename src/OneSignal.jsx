import React, { useState, useEffect } from 'react';

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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userId, setUserId] = useState(null);
  

  useEffect(() => {
    // Check for Notification API support
    if (!("Notification" in window)) {
      console.error("This browser does not support desktop notification");
      return;
    } else {
      setPermission(Notification.permission);
    }

    // Initialize OneSignalDeferred
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // Function to load the OneSignal SDK script
    const loadOneSignalSDK = () => {
      // Check if SDK is already loaded
      if (window.OneSignal) {
        console.log("OneSignal SDK already loaded");
        initializeOneSignal();
        return;
      }

      const script = document.createElement('script');
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      
      script.onload = () => {
        console.log("OneSignal SDK script loaded");
        initializeOneSignal();
      };
      
      script.onerror = (error) => {
        console.error("Failed to load OneSignal SDK:", error);
      };
      
      document.head.appendChild(script);
    };

    const initializeOneSignal = () => {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          console.log("Initializing OneSignal...");
          
          await OneSignal.init({
            appId: "02d12db1-1701-46b8-b7ec-4d8b39fcbf99",
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: false
            },
            promptOptions: {
              slidedown: {
                prompts: [{
                  type: "push",
                  autoPrompt: false
                }]
              }
            }
          });

          console.log("OneSignal initialized successfully");

          // Check and log current state
          await checkAndLogUserState();

          // Set up event listeners
          OneSignal.Notifications.addEventListener('permissionChange', async function(permission) {
            console.log('Permission changed:', permission);
            setPermission(permission ? 'granted' : 'denied');
            // Recheck user state after permission change
            setTimeout(() => checkAndLogUserState(), 1000);
          });

          OneSignal.User.PushSubscription.addEventListener('change', async function(event) {
            console.log("Push subscription changed:", event);
            if (event.current.optedIn !== undefined) {
              setIsSubscribed(event.current.optedIn);
            }
           
            // Check for user ID when subscription changes
            setTimeout(() => checkAndLogUserState(), 1000);
          });

          setIsOneSignalInitialized(true);

        } catch (error) {
          console.error("Error initializing OneSignal:", error);
        }
      });
    };

    const checkAndLogUserState = async () => {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          const currentUserId = await OneSignal.User.onesignalId;
          const currentSubscriptionId = await OneSignal.User.PushSubscription.id;
          const currentOptedIn = await OneSignal.User.PushSubscription.optedIn;
          const currentPermission = await OneSignal.Notifications.permission;
          const currentTags = await OneSignal.User.getTags();

          console.log("Current OneSignal State:", {
            userId: currentUserId,
            subscriptionId: currentSubscriptionId,
            optedIn: currentOptedIn,
            permission: currentPermission,
            tags: currentTags
          });

          setUserId(currentUserId);
          
          setIsSubscribed(currentOptedIn);
          setPermission(currentPermission ? 'granted' : 'denied');

          // If we have a user ID and saved category, apply tags
          if (currentUserId && currentOptedIn) {
            const savedCategory = localStorage.getItem('userSelectedCategory');
            if (savedCategory) {
              console.log("Applying saved category:", savedCategory);
              await applyUserTags(savedCategory);
            }
          }
        } catch (error) {
          console.error("Error checking user state:", error);
        }
      });
    };

    loadOneSignalSDK();

    // Load saved category from localStorage
    const savedCategory = localStorage.getItem('userSelectedCategory');
    if (savedCategory) {
      setSelectedCategory(savedCategory);
    }
  }, []);

  const applyUserTags = async (categoryId) => {
  return new Promise((resolve) => {
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        // Double-check user ID
        const currentUserId = await OneSignal.User.onesignalId;
        console.log("Applying tags for user:", currentUserId);

        if (!currentUserId) {
          console.log("No user ID available yet");
          resolve(false);
          return;
        }

        // Get current tags before modification
        const currentTags = await OneSignal.User.getTags();
        console.log("Current tags before update:", currentTags);

        // Remove all category tags one by one to avoid JSON parsing issues
        for (const category of categories) {
          if (category.id !== categoryId) {
            try {
              console.log(`Removing tag: ${category.id}`);
              await OneSignal.User.removeTag(category.id);
            } catch (err) {
              console.warn(`Failed to remove tag ${category.id}:`, err);
            }
          }
        }

        // Add the selected category tag
        console.log(`Adding tag: ${categoryId} = true`);
        await OneSignal.User.addTag(categoryId, "true");

        // Verify tags were applied
        setTimeout(async () => {
          const updatedTags = await OneSignal.User.getTags();
          console.log("Tags after update:", updatedTags);
          resolve(true);
        }, 500);

      } catch (error) {
        console.error("Error applying tags:", error);
        resolve(false);
      }
    });
  });
};


  const handleCategorySelect = async (category) => {
     console.log("Selected category object:", category);
    console.log("Category ID to be stored:", category.id);
    console.log("Category name:", category.name);


    // Update state and localStorage
    setSelectedCategory(category.id);
    localStorage.setItem('userSelectedCategory', category.id);

    // Send a local notification if permitted
    if (permission === 'granted' && "Notification" in window) {
      try {
        new Notification(`Kategorie geändert: ${category.name}`, {
          body: category.txt,
          tag: 'category-change-notification'
        });
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    }

    // Apply tags if we have a user ID
    if (isOneSignalInitialized && userId) {
      const success = await applyUserTags(category.id);
      if (!success) {
        console.log("Failed to apply tags, will retry when user is available");
      }
    } else {
      console.log("Waiting for user to be created. Current state:", {
        initialized: isOneSignalInitialized,
        userId: userId,
        subscribed: isSubscribed
      });
    }
  };

  const handleSubscribeClick = () => {
    if (isOneSignalInitialized) {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          console.log('Requesting notification permission...');
          
          // Request permission
          await OneSignal.Notifications.requestPermission();
          
          // Wait for subscription to be created and then apply tags
          const checkInterval = setInterval(async () => {
            const currentUserId = await OneSignal.User.onesignalId;
            const currentOptedIn = await OneSignal.User.PushSubscription.optedIn;
            
            console.log("Checking subscription status:", { userId: currentUserId, optedIn: currentOptedIn });
            
            if (currentUserId && currentOptedIn) {
              clearInterval(checkInterval);
              const savedCategory = localStorage.getItem('userSelectedCategory');
              if (savedCategory) {
                console.log("User subscribed, applying saved category:", savedCategory);
                await applyUserTags(savedCategory);
              }
            }
          }, 1000);

          // Stop checking after 10 seconds
          setTimeout(() => clearInterval(checkInterval), 10000);
          
        } catch (error) {
          console.error("Error requesting permission:", error);
        }
      });
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 mb-2">Benachrichtigungen verwalten</h1>
          <p className="text-lg text-gray-300">Wählen Sie eine Kategorie, um relevante Benachrichtigungen zu erhalten.</p>
          {/* Debug info - remove in production */}
          <div className="text-xs text-gray-500 mt-2">
            User ID: {userId || 'none'} | Subscribed: {isSubscribed ? 'yes' : 'no'}
          </div>
        </header>

        {(!isSubscribed || permission !== 'granted') && (
          <div className="bg-yellow-800 bg-opacity-50 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-lg relative mb-6 text-center">
            <strong className="font-bold block">Achtung!</strong>
            <span className="block sm:inline">
              {!isOneSignalInitialized 
                ? "OneSignal wird geladen..." 
                : "Benachrichtigungen sind nicht aktiviert. Klicken Sie hier, um sie zu abonnieren."}
            </span>
            {isOneSignalInitialized && (
              <button 
                onClick={handleSubscribeClick} 
                className="mt-2 sm:mt-0 sm:ml-4 inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                Abonnieren
              </button>
            )}
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
