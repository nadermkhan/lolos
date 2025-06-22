import { useState, useEffect, useRef } from "react"
import addNotification from 'react-push-notification'

const ONE_SIGNAL_APP_ID = "e16551ca-db6f-48ea-9145-e32474cbe93a"

const categories = [
  {
    id: "weekly_report",
    name: "Weekly Report",
    description: "Latest news in technology and innovation.",
    txt: "Ihr Wochenrückblick aus dem Rathaus! Jeden Freitag erhalten Sie unseren Wochenbericht kompakt zusammengefasst, was die Verwaltung diese Woche im Ort bewegt hat. Von wichtigen Entscheidungen über Projekte, Veranstaltungen oder interessante Fakten über die Gemeinde. Bleiben Sie mühelos auf dem Laufenden über alles, was in Laaber passiert ist.",
  },
  {
    id: "townhall_news",
    name: "Town Hall News",
    description: "Announcements for our new products.",
    txt: "Hier erhalten Sie alle allgemeinen Informationen aus der Verwaltung. Wir informieren Sie über Schließtage, geänderte Öffnungszeiten, bevorstehende Gemeinderatssitzungen, wichtige Ergebnisse aus dem Haushaltsbericht, geplante Bauvorhaben der Gemeinde oder ein neues Mitteilungsblatt.",
  },
  {
    id: "emergencies",
    name: "Emergencies",
    description: "Exclusive discounts and promotions.",
    txt: "Dieser Kanal ist für wichtige Informationen im Notfall oder bei Katastrophen. Ob Unwetterwarnungen, Hochwasser oder andere akute Gefahren im Ortsbereich wir informieren Sie umgehend.",
  },
  {
    id: "closures_and_disruptions",
    name: "Closures and disruptions",
    description: "Updates and news from our team.",
    txt: "Hier gibt es aktuelle Meldungen zur öffentlichen Versorgung und zum Verkehr. Das bedeutet: Sofortige Infos zu Straßensperrungen, wichtigen Baustellen und anderen relevanten Beeinträchtigungen",
  },
  {
    id: "events",
    name: "Events",
    description: "A roundup of the weeks best content.",
    txt: "Was ist diese Woche los in Laaber? Jeden Montag liefern wir Ihnen die Veranstaltungen für die kommende Woche! Erfahren Sie auf einen Blick, welche öffentlichen Feste, Märkte, Konzerte oder Sportevents anstehen",
  },
]

// Custom Card Components
const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children }) => (
  <div className="p-6 pb-4">{children}</div>
)

const CardTitle = ({ children }) => (
  <h3 className="text-2xl font-semibold leading-none tracking-tight">{children}</h3>
)

const CardDescription = ({ children }) => (
  <p className="text-sm text-gray-500 mt-1.5">{children}</p>
)

const CardContent = ({ children }) => (
  <div className="p-6 pt-0">{children}</div>
)

// Custom Radio Group Components
const RadioGroup = ({ value, onValueChange, children, className = "" }) => (
  <div className={className}>{children}</div>
)

const RadioGroupItem = ({ value, id }) => (
  <input
    type="radio"
    id={id}
    name="notification-category"
    value={value}
    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
  />
)

const Label = ({ htmlFor, children, className = "" }) => (
  <label htmlFor={htmlFor} className={className}>
    {children}
  </label>
)

// Utility function for retrying tag updates
const updateTagsWithRetry = async (tags, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await window.OneSignal.User.addTags(tags);
      console.log('Tags successfully updated:', tags);
      return true;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        // Wait before retrying, with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  return false;
};

export default function OneSignal() {
  const [oneSignalState, setOneSignalState] = useState({
    isLoading: true,
    isInitialized: false,
    isSubscribed: false,
    permission: "default",
    userId: null,
    error: null,
  })
  const [selectedCategory, setSelectedCategory] = useState(null)
  const initializationRef = useRef(false)

  // Load saved category from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedNotificationCategory")
    if (saved) {
      setSelectedCategory(saved)
    }
  }, [])

  // Initialize OneSignal
  useEffect(() => {
    const initializeOneSignal = async () => {
      if (initializationRef.current || window.OneSignalInitialized) {
        // If already initialized, just update the state
        if (window.OneSignal && window.OneSignal.initialized) {
          try {
            const isPushSupported = window.OneSignal.Notifications.isPushSupported()
            if (isPushSupported) {
              const permission = await window.OneSignal.Notifications.permission
              const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn
              const subscriptionId = await window.OneSignal.User.PushSubscription.id
              
              // Get user ID using the correct method
              const onesignalId = await window.OneSignal.User.onesignalId

              console.log('OneSignal State:', {
                permission,
                isOptedIn,
                subscriptionId,
                onesignalId
              })

              setOneSignalState({
                isLoading: false,
                isInitialized: true,
                isSubscribed: isOptedIn,
                permission,
                userId: onesignalId || subscriptionId,
                error: null,
              })

              if (isOptedIn && onesignalId) {
                const savedCategory = localStorage.getItem("selectedNotificationCategory")
                if (savedCategory) {
                  // Wait a bit before updating tags
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  const tags = {
                    category: savedCategory,
                    subscribed_at: new Date().toISOString()
                  };
                  
                  await updateTagsWithRetry(tags);
                }
              }
            }
          } catch (error) {
            console.error("Error checking OneSignal state:", error)
          }
        }
        return
      }
      initializationRef.current = true

      try {
        if (typeof window === "undefined") {
          return
        }

        // Load OneSignal SDK
        await new Promise((resolve, reject) => {
          if (window.OneSignal) {
            resolve()
            return
          }

          window.OneSignalDeferred = window.OneSignalDeferred || []

          const script = document.createElement("script")
          script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          script.async = true
          script.defer = true

          script.onload = () => {
            window.OneSignalDeferred.push(() => {
              resolve()
            })
          }

          script.onerror = () => {
            reject(new Error("Failed to load OneSignal SDK"))
          }

          document.head.appendChild(script)
        })

        const OneSignalInstance = await new Promise((resolve) => {
          if (window.OneSignal) {
            resolve(window.OneSignal)
          } else {
            window.OneSignalDeferred.push((OneSignal) => {
              resolve(OneSignal)
            })
          }
        })

        // Initialize OneSignal
        await OneSignalInstance.init({
          appId: ONE_SIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false
          },
          serviceWorkerParam: {
            scope: "/",
            workerName: "OneSignalSDKWorker.js",
            updaterWorkerName: "OneSignalSDKUpdaterWorker.js",
            registrationOptions: {
              scope: "/"
            }
          },
          persistNotification: true,
          webhooks: {
            cors: true,
          },
          autoResubscribe: true,
        })

        window.OneSignalInitialized = true

        // Wait for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 1000))

        const isPushSupported = OneSignalInstance.Notifications.isPushSupported()

        if (isPushSupported) {
          const permission = await OneSignalInstance.Notifications.permission
          const isOptedIn = await OneSignalInstance.User.PushSubscription.optedIn
          const subscriptionId = await OneSignalInstance.User.PushSubscription.id
          
          // Get user ID - this is the correct way
          const onesignalId = await OneSignalInstance.User.onesignalId

          console.log('OneSignal initialized with:', {
            permission,
            isOptedIn,
            subscriptionId,
            onesignalId
          })

          setOneSignalState({
            isLoading: false,
            isInitialized: true,
            isSubscribed: isOptedIn,
            permission,
            userId: onesignalId || subscriptionId,
            error: null,
          })

          if (isOptedIn && onesignalId) {
            // Set external ID for more reliable identification
            const externalId = localStorage.getItem('userExternalId') || 
                             `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            localStorage.setItem('userExternalId', externalId);
            
            try {
              await OneSignalInstance.login(externalId);
              console.log('External ID set:', externalId);
            } catch (error) {
              console.error('Error setting external ID:', error);
            }

            const savedCategory = localStorage.getItem("selectedNotificationCategory")
            if (savedCategory) {
              // Wait before updating tags to ensure user record is ready
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const tags = {
                category: savedCategory,
                subscribed_at: new Date().toISOString()
              };
              
              const success = await updateTagsWithRetry(tags);
              
              if (success) {
                localStorage.setItem("notificationSubscription", JSON.stringify({
                  userId: onesignalId,
                  category: savedCategory,
                  subscribedAt: new Date().toISOString()
                }));
              }
            }
          }

          // Event listeners
          OneSignalInstance.User.PushSubscription.addEventListener("change", async (event) => {
            const isNowOptedIn = event.current.optedIn
            const newOnesignalId = await OneSignalInstance.User.onesignalId

            console.log('Subscription changed', { 
              isNowOptedIn,
              newOnesignalId
            })

            setOneSignalState((prev) => ({
              ...prev,
              isSubscribed: isNowOptedIn,
              userId: newOnesignalId,
            }))

            if (isNowOptedIn && newOnesignalId) {
              const savedCategory = localStorage.getItem("selectedNotificationCategory")
              if (savedCategory) {
                // Wait a bit for the user record to be fully created
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const tags = {
                  category: savedCategory,
                  subscribed_at: new Date().toISOString()
                };
                
                const success = await updateTagsWithRetry(tags);
                
                if (success) {
                  localStorage.setItem("notificationSubscription", JSON.stringify({
                    userId: newOnesignalId,
                    category: savedCategory,
                    subscribedAt: new Date().toISOString()
                  }));
                }
              }
            } else {
              localStorage.removeItem("notificationSubscription")
            }
          })

          OneSignalInstance.Notifications.addEventListener("permissionChange", (permission) => {
            setOneSignalState((prev) => ({ ...prev, permission }))
          })
        } else {
          throw new Error("Push notifications are not supported in this browser")
        }
      } catch (error) {
        console.error("OneSignal initialization error:", error)
        setOneSignalState({
          isLoading: false,
          isInitialized: true,
          isSubscribed: false,
          permission: "default",
          userId: null,
          error: error.message,
        })
      }
    }

    initializeOneSignal()
  }, [])

  // Update subscription data when state changes
  useEffect(() => {
    const updateSubscriptionData = async () => {
      if (oneSignalState.isSubscribed && selectedCategory && oneSignalState.userId && window.OneSignal) {
        const tags = {
          category: selectedCategory,
          last_updated: new Date().toISOString()
        };

        const success = await updateTagsWithRetry(tags);
        
        if (success) {
          console.log('Tags updated for user:', oneSignalState.userId, { category: selectedCategory });
          
          localStorage.setItem("notificationSubscription", JSON.stringify({
            userId: oneSignalState.userId,
            category: selectedCategory,
            subscribedAt: new Date().toISOString()
          }));
        }
      }
    }

    updateSubscriptionData()
  }, [selectedCategory, oneSignalState.isSubscribed, oneSignalState.userId])

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId)
    localStorage.setItem("selectedNotificationCategory", categoryId)

    const category = categories.find((cat) => cat.id === categoryId)

    if (category) {
      // Use react-push-notification for category change
      addNotification({
        title: `You've selected ${category.name} notifications`,
        subtitle: category.name,
        message: `${category.txt}`,
        theme: 'darkblue',
        native: true,
        duration: 5000,
        vibrate: 1,
        onClick: () => console.log('Notification clicked'),
      })

      // If already subscribed, update OneSignal tags with retry
      if (oneSignalState.isSubscribed && oneSignalState.userId && window.OneSignal) {
        const tags = {
          category: categoryId,
          category_name: category.name,
          updated_at: new Date().toISOString()
        };

        const success = await updateTagsWithRetry(tags);
        
        if (success) {
          console.log('Category updated for user:', oneSignalState.userId, categoryId);
          
          localStorage.setItem("notificationSubscription", JSON.stringify({
            userId: oneSignalState.userId,
            category: categoryId,
            subscribedAt: new Date().toISOString()
          }));
        } else {
          console.error("Failed to update tags after retries");
          // Show a user-friendly error message
          addNotification({
            title: 'Update pending',
            message: 'Your preference has been saved and will be updated shortly.',
            theme: 'light',
            duration: 3000,
          });
        }
      }
    }
  }

  const handleSubscribe = async () => {
    if (!window.OneSignal) {
      console.error("OneSignal is not initialized");
      return;
    }

    try {
      // Request permission and subscribe
      await window.OneSignal.User.PushSubscription.optIn();
      
      // Wait for the subscription to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the new user ID
      const newUserId = await window.OneSignal.User.onesignalId;
      
      if (newUserId && selectedCategory) {
        // Set external ID
        const externalId = localStorage.getItem('userExternalId') || 
                         `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        localStorage.setItem('userExternalId', externalId);
        
        try {
          await window.OneSignal.login(externalId);
          console.log('External ID set on subscribe:', externalId);
        } catch (error) {
          console.error('Error setting external ID:', error);
        }

        // Update tags with retry
        const tags = {
          category: selectedCategory,
          category_name: categories.find(c => c.id === selectedCategory)?.name,
          subscribed_at: new Date().toISOString()
        };
        
        await updateTagsWithRetry(tags);
      }
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      addNotification({
        title: 'Subscription failed',
        message: 'Please try again or check your browser settings.',
        theme: 'red',
        duration: 4000,
      });
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.OneSignal) {
      console.error("OneSignal is not initialized");
      return;
    }

    try {
      await window.OneSignal.User.PushSubscription.optOut();
      localStorage.removeItem("notificationSubscription");
      
      addNotification({
        title: 'Unsubscribed',
        message: 'You have been unsubscribed from notifications.',
        theme: 'light',
        duration: 3000,
      });
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Notification Preferences</h1>
          <p className="text-gray-500 mt-2">Select a category to receive tailored push notifications.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose Your Category</CardTitle>
            <CardDescription>Select the type of notifications you'd like to receive</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedCategory || ""} onValueChange={handleCategoryChange} className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <RadioGroupItem value={category.id} id={category.id} />
                  <Label htmlFor={category.id} className="flex-1 cursor-pointer space-y-1">
                    <div className="font-semibold">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Subscription Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Status</CardTitle>
            <CardDescription>
              {oneSignalState.isLoading ? "Checking notification status..." : 
               oneSignalState.isSubscribed ? "You are currently subscribed to notifications" : 
               "Enable notifications to stay updated"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!oneSignalState.isLoading && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Push Notifications</span>
                    <span className={`text-sm ${oneSignalState.isSubscribed ? 'text-green-600' : 'text-gray-500'}`}>
                      {oneSignalState.isSubscribed ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  {selectedCategory && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selected Category</span>
                      <span className="text-sm text-blue-600">
                        {categories.find(c => c.id === selectedCategory)?.name || 'None'}
                      </span>
                    </div>
                  )}

                  <div className="pt-4">
                    {!oneSignalState.isSubscribed ? (
                      <button
                        onClick={handleSubscribe}
                        disabled={!selectedCategory}
                        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                          selectedCategory 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {selectedCategory ? 'Enable Notifications' : 'Please select a category first'}
                      </button>
                    ) : (
                      <button
                        onClick={handleUnsubscribe}
                        className="w-full py-2 px-4 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Disable Notifications
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600">
            <p className="font-semibold mb-2">Debug Info:</p>
            <div className="space-y-1">
              <p>App ID: {ONE_SIGNAL_APP_ID}</p>
              <p>User ID: {oneSignalState.userId || 'Not subscribed'}</p>
              <p>External ID: {localStorage.getItem('userExternalId') || 'Not set'}</p>
              <p>Subscribed: {oneSignalState.isSubscribed ? 'Yes' : 'No'}</p>
              <p>Permission: {oneSignalState.permission}</p>
              <p>Selected Category: {selectedCategory || 'None'}</p>
              <p>Initialized: {oneSignalState.isInitialized ? 'Yes' : 'No'}</p>
              {oneSignalState.error && <p className="text-red-600">Error: {oneSignalState.error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
