import { useState, useEffect, useRef } from "react"
import { Bell, CheckCircle, Loader2, AlertCircle, XCircle } from "lucide-react"
import addNotification from 'react-push-notification'

const ONE_SIGNAL_APP_ID = "a405e5ea-deec-490e-bdc3-38b65b4ec31c"
const CONFIG_URL = ""

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

// Custom Button Component
const Button = ({ children, onClick, disabled, className = "", size = "default" }) => {
  const sizeClasses = size === "lg" ? "px-8 py-3 text-lg" : "px-4 py-2"
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md bg-blue-600 text-white font-medium transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${className}`}
    >
      {children}
    </button>
  )
}

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

// Custom Alert Component
const Alert = ({ children, variant = "default", className = "" }) => {
  const variantClasses = variant === "destructive" 
    ? "border-red-600 bg-red-50" 
    : "border-gray-200 bg-gray-50"
  
  return (
    <div className={`relative w-full rounded-lg border p-4 ${variantClasses} ${className}`}>
      {children}
    </div>
  )
}

const AlertTitle = ({ children, className = "" }) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
    {children}
  </h5>
)

const AlertDescription = ({ children, className = "" }) => (
  <div className={`text-sm ${className}`}>{children}</div>
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

export default function OneSignal() {
  const [appConfig, setAppConfig] = useState(null)
  const [configLoading, setConfigLoading] = useState(true)
 // const [configError, setConfigError] = useState(null)
  const [lastConfigCheck, setLastConfigCheck] = useState(null)
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

  // Fetch remote config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigLoading(true)

        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const urlWithParams = `${CONFIG_URL}?t=${timestamp}&r=${random}`
        
        const response = await fetch(urlWithParams, {
          method: 'GET',
          cache: 'no-cache',
          mode: 'cors',
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status}`)
        }
        
        const data = await response.json()
        
        setAppConfig(data)
        setConfigError(null)
        setLastConfigCheck(new Date())
        
        console.log('Config fetched:', new Date().toISOString(), data)
      } catch (error) {
        console.error("Error fetching config:", error)
        setConfigError("Failed to load app configuration")
        setAppConfig({ appEnabled: true })
      } finally {
        setConfigLoading(false)
      }
    }

    fetchConfig()
    const interval = setInterval(fetchConfig, 30000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchConfig()
      }
    }

    const handleFocus = () => {
      fetchConfig()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Load saved category from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedNotificationCategory")
    if (saved) {
      setSelectedCategory(saved)
    }
  }, [])

  // Initialize OneSignal
  useEffect(() => {
    if (!appConfig?.appEnabled || configLoading) {
      return
    }

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
                  await window.OneSignal.User.addTags({
                    category: savedCategory,
                    subscribed_at: new Date().toISOString()
                  })
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
            const savedCategory = localStorage.getItem("selectedNotificationCategory")
            if (savedCategory) {
              await OneSignalInstance.User.addTags({
                category: savedCategory,
                subscribed_at: new Date().toISOString()
              })
              
              localStorage.setItem("notificationSubscription", JSON.stringify({
                userId: onesignalId,
                category: savedCategory,
                subscribedAt: new Date().toISOString()
              }))
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
                await OneSignalInstance.User.addTags({
                  category: savedCategory,
                  subscribed_at: new Date().toISOString()
                })
                
                localStorage.setItem("notificationSubscription", JSON.stringify({
                  userId: newOnesignalId,
                  category: savedCategory,
                  subscribedAt: new Date().toISOString()
                }))
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
  }, [appConfig, configLoading])

  // Update subscription data when state changes
  useEffect(() => {
    const updateSubscriptionData = async () => {
      if (oneSignalState.isSubscribed && selectedCategory && oneSignalState.userId && window.OneSignal) {
        try {
          await window.OneSignal.User.addTags({
                        category: selectedCategory,
            last_updated: new Date().toISOString()
          })

          console.log('Tags updated for user:', oneSignalState.userId, { category: selectedCategory })
        } catch (error) {
          console.error("Error updating tags:", error)
        }
        
        localStorage.setItem("notificationSubscription", JSON.stringify({
          userId: oneSignalState.userId,
          category: selectedCategory,
          subscribedAt: new Date().toISOString()
        }))
      }
    }

    updateSubscriptionData()
  }, [selectedCategory, oneSignalState.isSubscribed, oneSignalState.userId])

  const handleSubscribe = async () => {
    try {
      if (!window.OneSignal || !selectedCategory) {
        return
      }

      // Use the prompt method
      await window.OneSignal.Slidedown.promptPush()
      
      // Wait a bit for the subscription to complete
      setTimeout(async () => {
        const onesignalId = await window.OneSignal.User.onesignalId
        if (onesignalId) {
          console.log('User subscribed with ID:', onesignalId)
        }
      }, 2000)
    } catch (error) {
      console.error("Subscribe error:", error)
    }
  }

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

      // If already subscribed, update OneSignal tags
      if (oneSignalState.isSubscribed && oneSignalState.userId && window.OneSignal) {
        try {
          await window.OneSignal.User.addTags({
            category: categoryId,
            category_name: category.name,
            updated_at: new Date().toISOString()
          })
          
          console.log('Category updated for user:', oneSignalState.userId, categoryId)
          
          localStorage.setItem("notificationSubscription", JSON.stringify({
            userId: oneSignalState.userId,
            category: categoryId,
            subscribedAt: new Date().toISOString()
          }))
        } catch (error) {
          console.error("Error updating OneSignal tags:", error)
        }
      }
    }
  }

  // Show loading state while checking config
  if (configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading configuration...</span>
        </div>
      </div>
    )
  }

  // Show maintenance message if app is disabled
  if (appConfig && !appConfig.appEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <CardTitle>Service Unavailable</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              {appConfig.maintenanceMessage || "The notification service is temporarily unavailable. Please try again later."}
            </p>
            {appConfig.lastUpdated && (
              <p className="text-sm text-gray-500 mt-4">
                Last updated: {new Date(appConfig.lastUpdated).toLocaleString()}
              </p>
            )}
            {lastConfigCheck && (
              <p className="text-xs text-gray-500 mt-2">
                Config checked: {lastConfigCheck.toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // const renderStatus = () => {
  // //   if (oneSignalState.isLoading) {
  // //     return (
  // //       <div className="flex items-center justify-center space-x-2 text-gray-500">
  // //         <Loader2 className="h-4 w-4 animate-spin" />
  // //         <span>Initializing Notification Service...</span>
  // //       </div>
  // //     )
  // //   }

  //   // if (oneSignalState.error) {
  //   //   return (
  //   //     <Alert variant="destructive">
  //   //       <div className="flex items-start">
  //   //         <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2" />
  //   //         <div className="flex-1">
  //   //           <AlertTitle className="text-red-600">Error</AlertTitle>
  //   //           <AlertDescription className="text-red-700">
  //   //             {oneSignalState.error}
  //   //             <div className="mt-2 text-sm">
  //   //               <strong>Troubleshooting:</strong>
  //   //               <ul className="list-disc ml-4 mt-1">
  //   //                 <li>Make sure you're accessing the site via HTTPS</li>
  //   //                 <li>Check if service worker files are accessible</li>
  //   //                 <li>Try refreshing the page</li>
  //   //               </ul>
  //   //             </div>
  //   //           </AlertDescription>
  //   //         </div>
  //   //       </div>
  //   //     </Alert>
  //   //   )
  //   // }

  //   // if (oneSignalState.permission === "denied") {
  //   //   return (
  //   //     <Alert variant="destructive">
  //   //       <AlertTitle className="text-red-600">Notifications Blocked</AlertTitle>
  //   //       <AlertDescription className="text-red-700">
  //   //         You have blocked notifications. Please enable them in your browser settings:
  //   //         <ol className="mt-2 ml-4 list-decimal text-sm">
  //   //           <li>Click the lock icon in your address bar</li>
  //   //           <li>Find "Notifications" in the permissions</li>
  //   //           <li>Change it to "Allow"</li>
  //   //           <li>Refresh this page</li>
  //   //         </ol>
  //   //       </AlertDescription>
  //   //     </Alert>
  //   //   )
  //   // }

  //   if (!oneSignalState.isSubscribed) {
  //     return (
  //       <div className="space-y-4">
  //         <p className="text-center text-gray-500">
  //           {selectedCategory
  //             ? "Click below to enable notifications for your selected category"
  //             : "Please select a category first, then enable notifications"}
  //         </p>
  //         <Button
  //           onClick={handleSubscribe}
  //           disabled={!selectedCategory || !oneSignalState.isInitialized}
  //           className="w-full"
  //           size="lg"
  //         >
  //           <Bell className="mr-2 h-4 w-4" />
  //           Enable Notifications
  //         </Button>
  //       </div>
  //     )
  //   }

  //   return (
  //     <Alert className="border-green-600 bg-green-50">
  //       <div className="flex items-start">
  //         <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
  //         <div className="flex-1">
  //           <AlertTitle className="text-green-600">Notifications Enabled!</AlertTitle>
  //           <AlertDescription className="text-gray-600">
  //             <div>Your User ID: {oneSignalState.userId || "Loading..."}</div>
  //             <div>Category: {categories.find(c => c.id === selectedCategory)?.name || "None selected"}</div>
  //             <div className="mt-2 text-xs">
  //               Push notifications will be delivered even when the website is closed, as long as you have internet connectivity.
  //             </div>
  //             {/* Debug info - remove in production */}
  //             <div className="mt-2 text-xs opacity-50">
  //               Debug: Subscribed={oneSignalState.isSubscribed.toString()}, Permission={oneSignalState.permission}
  //             </div>
  //           </AlertDescription>
  //         </div>
  //       </div>
  //     </Alert>
  //   )
  // }

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

      </div>
    </div>
  )
}