"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlarmClock,
  BedDouble,
  Coffee,
  Sun,
  Moon,
  Trophy,
  Calendar,
  AlertCircle,
  BarChart3,
  Share2,
  Award,
  CheckCircle2,
  Settings,
  Info,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react"

export default function OversleepPage() {
  // State management with local storage
  const [bedtime, setBedtime] = useState("")
  const [wakeTime, setWakeTime] = useState("")
  const [sleepTips, setSleepTips] = useState([])
  const [challengeStreak, setChallengeStreak] = useState(0)
  const [totalDaysTracked, setTotalDaysTracked] = useState(0)
  const [motivationalMessage, setMotivationalMessage] = useState("")
  const [sleepQuality, setSleepQuality] = useState(null)
  const [lastWakeupDate, setLastWakeupDate] = useState(null)
  const [sleepGoal, setSleepGoal] = useState(8)
  const [alarmSound, setAlarmSound] = useState(true)
  const [weeklyData, setWeeklyData] = useState([])
  const [achievements, setAchievements] = useState([])
  const [activeTab, setActiveTab] = useState("main")
  const [sleepNotes, setSleepNotes] = useState("")
  const [showTips, setShowTips] = useState(true)

  // Comprehensive sleep prevention tips
  const sleepPreventionTips = [
    "Place your alarm clock far from your bed",
    "Use a sleep cycle alarm app",
    "Go to bed and wake up at consistent times",
    "Create a relaxing bedtime routine",
    "Avoid screens 1 hour before sleep",
    "Keep your bedroom cool and dark",
    "Practice a morning stretching routine",
    "Drink a glass of water immediately after waking",
    "Use natural light to help wake up",
    "Plan an exciting morning activity",
    "Avoid caffeine 6 hours before bedtime",
    "Try meditation or deep breathing before sleep",
    "Maintain a consistent sleep schedule on weekends",
    "Exercise regularly, but not close to bedtime",
    "Use white noise or calming sounds",
  ]

  // Motivational messages generator
  const motivationalMessages = [
    "You've got this! Another great day starts with a good wake-up.",
    "Early morning is a superpower. Keep crushing it!",
    "Consistency is key. You're building an awesome habit!",
    "Every morning is a new opportunity to be awesome.",
    "Small victories lead to big changes. Keep going!",
    "Rise and shine! Your future self will thank you.",
    "Morning people get more done. You're becoming one of them!",
    "The early bird catches the worm and achieves their goals.",
    "Each morning is a fresh start. Make it count!",
    "Your dedication to better sleep habits is inspiring!",
  ]

  // Achievement badges
  const possibleAchievements = [
    {
      id: "streak3",
      name: "3-Day Streak",
      icon: <Award className="h-5 w-5 text-yellow-400" />,
      description: "Woke up on time for 3 consecutive days",
      unlocked: false,
    },
    {
      id: "streak7",
      name: "7-Day Streak",
      icon: <Award className="h-5 w-5 text-yellow-400" />,
      description: "Woke up on time for a full week",
      unlocked: false,
    },
    {
      id: "streak30",
      name: "Sleep Master",
      icon: <Award className="h-5 w-5 text-yellow-400" />,
      description: "Maintained a 30-day wake-up streak",
      unlocked: false,
    },
    {
      id: "quality7",
      name: "Quality Sleeper",
      icon: <Award className="h-5 w-5 text-blue-400" />,
      description: "Reported excellent sleep quality 7 times",
      unlocked: false,
    },
    {
      id: "consistent",
      name: "Consistency King",
      icon: <Award className="h-5 w-5 text-green-400" />,
      description: "Same wake-up time for 5 consecutive days",
      unlocked: false,
    },
    {
      id: "notes5",
      name: "Sleep Analyst",
      icon: <Award className="h-5 w-5 text-purple-400" />,
      description: "Added sleep notes for 5 days",
      unlocked: false,
    },
  ]

  // Load data from localStorage on client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBedtime(localStorage.getItem("bedtime") || "")
      setWakeTime(localStorage.getItem("wakeTime") || "")
      setChallengeStreak(Number.parseInt(localStorage.getItem("challengeStreak") || "0"))
      setTotalDaysTracked(Number.parseInt(localStorage.getItem("totalDaysTracked") || "0"))
      setSleepQuality(localStorage.getItem("sleepQuality") || null)
      setLastWakeupDate(localStorage.getItem("lastWakeupDate") || null)
      setSleepGoal(Number.parseInt(localStorage.getItem("sleepGoal") || "8"))
      setAlarmSound(localStorage.getItem("alarmSound") !== "false")
      setSleepNotes(localStorage.getItem("sleepNotes") || "")
      setShowTips(localStorage.getItem("showTips") !== "false")

      // Load weekly data
      const storedWeeklyData = localStorage.getItem("weeklyData")
      if (storedWeeklyData) {
        try {
          const parsedData = JSON.parse(storedWeeklyData)
          setWeeklyData(Array.isArray(parsedData) ? parsedData : [])
        } catch (error) {
          console.error("Error parsing weekly data:", error)
          setWeeklyData([])
        }
      } else {
        // Initialize with empty data for the past week
        const emptyWeek = Array(7)
          .fill()
          .map((_, i) => ({
            day: getDayName(i),
            hours: 0,
            quality: null,
          }))
        setWeeklyData(emptyWeek)
      }

      // Load achievements with proper error handling
      const storedAchievements = localStorage.getItem("achievements")
      if (storedAchievements) {
        try {
          const parsedAchievements = JSON.parse(storedAchievements)
          setAchievements(Array.isArray(parsedAchievements) ? parsedAchievements : possibleAchievements)
        } catch (error) {
          console.error("Error parsing achievements:", error)
          setAchievements(possibleAchievements)
        }
      } else {
        setAchievements(possibleAchievements)
      }
    }
  }, [])

  // Generate random tips and motivational messages
  const generateRandomTips = () => {
    const shuffled = [...sleepPreventionTips].sort(() => 0.5 - Math.random())
    setSleepTips(shuffled.slice(0, 3))
    setMotivationalMessage(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)])
  }

  // Get day name helper
  function getDayName(dayOffset) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const today = new Date()
    const dayIndex = (today.getDay() - dayOffset + 7) % 7
    return days[dayIndex]
  }

  // Calculate sleep duration
  const calculateSleepDuration = () => {
    if (!bedtime || !wakeTime) return null

    const bedtimeDate = new Date()
    const [bedHours, bedMinutes] = bedtime.split(":").map(Number)
    bedtimeDate.setHours(bedHours, bedMinutes, 0)

    const wakeTimeDate = new Date()
    const [wakeHours, wakeMinutes] = wakeTime.split(":").map(Number)
    wakeTimeDate.setHours(wakeHours, wakeMinutes, 0)

    // If wake time is earlier than bedtime, add a day
    if (wakeTimeDate < bedtimeDate) {
      wakeTimeDate.setDate(wakeTimeDate.getDate() + 1)
    }

    const diffMs = wakeTimeDate - bedtimeDate
    const diffHrs = diffMs / (1000 * 60 * 60)

    return diffHrs.toFixed(1)
  }

  // Update achievements
  const updateAchievements = () => {
    const newAchievements = [...achievements]

    // Check for streak achievements
    if (challengeStreak >= 3) {
      const streak3 = newAchievements.find((a) => a.id === "streak3")
      if (streak3 && !streak3.unlocked) {
        streak3.unlocked = true
        showAchievementNotification("3-Day Streak")
      }
    }

    if (challengeStreak >= 7) {
      const streak7 = newAchievements.find((a) => a.id === "streak7")
      if (streak7 && !streak7.unlocked) {
        streak7.unlocked = true
        showAchievementNotification("7-Day Streak")
      }
    }

    if (challengeStreak >= 30) {
      const streak30 = newAchievements.find((a) => a.id === "streak30")
      if (streak30 && !streak30.unlocked) {
        streak30.unlocked = true
        showAchievementNotification("Sleep Master")
      }
    }

    // Check for notes achievement
    if (sleepNotes.trim().length > 0) {
      const notesCount = Number.parseInt(localStorage.getItem("notesCount") || "0") + 1
      localStorage.setItem("notesCount", notesCount.toString())

      if (notesCount >= 5) {
        const notes5 = newAchievements.find((a) => a.id === "notes5")
        if (notes5 && !notes5.unlocked) {
          notes5.unlocked = true
          showAchievementNotification("Sleep Analyst")
        }
      }
    }

    // Count excellent quality sleeps
    if (sleepQuality === "Excellent") {
      const excellentCount = Number.parseInt(localStorage.getItem("excellentCount") || "0") + 1
      localStorage.setItem("excellentCount", excellentCount.toString())

      if (excellentCount >= 7) {
        const quality7 = newAchievements.find((a) => a.id === "quality7")
        if (quality7 && !quality7.unlocked) {
          quality7.unlocked = true
          showAchievementNotification("Quality Sleeper")
        }
      }
    }

    setAchievements(newAchievements)
    localStorage.setItem("achievements", JSON.stringify(newAchievements))
  }

  // Show achievement notification
  const showAchievementNotification = (achievementName) => {
    if (typeof window !== "undefined") {
      // In a real app, you'd implement a toast notification here
      alert(`🏆 Achievement Unlocked: ${achievementName}!`)
    }
  }

  // Update weekly data
  const updateWeeklyData = () => {
    const sleepDuration = calculateSleepDuration()
    if (!sleepDuration) return

    const today = new Date().getDay()
    const newWeeklyData = [...weeklyData]

    newWeeklyData[today] = {
      day: getDayName(0),
      hours: Number.parseFloat(sleepDuration),
      quality: sleepQuality,
    }

    setWeeklyData(newWeeklyData)
    localStorage.setItem("weeklyData", JSON.stringify(newWeeklyData))
  }

  // Handle successful wake-up
  const handleWakeupSuccess = () => {
    if (typeof window === "undefined") return

    const today = new Date().toDateString()

    // Check if it's a new day to maintain streak
    if (lastWakeupDate !== today) {
      const newStreak = challengeStreak + 1
      const newTotalDays = totalDaysTracked + 1

      setChallengeStreak(newStreak)
      setTotalDaysTracked(newTotalDays)
      setLastWakeupDate(today)

      // Save to local storage
      localStorage.setItem("challengeStreak", newStreak.toString())
      localStorage.setItem("totalDaysTracked", newTotalDays.toString())
      localStorage.setItem("lastWakeupDate", today)

      // Update weekly data and achievements
      updateWeeklyData()
      updateAchievements()
    }

    generateRandomTips()
  }

  // Sleep quality tracking
  const handleSleepQuality = (quality) => {
    if (typeof window !== "undefined") {
      setSleepQuality(quality)
      localStorage.setItem("sleepQuality", quality)
    }
  }

  // Save bedtime and wake time to local storage
  useEffect(() => {
    if (typeof window !== "undefined" && bedtime) {
      localStorage.setItem("bedtime", bedtime)
    }
  }, [bedtime])

  useEffect(() => {
    if (typeof window !== "undefined" && wakeTime) {
      localStorage.setItem("wakeTime", wakeTime)
    }
  }, [wakeTime])

  // Save sleep goal
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sleepGoal", sleepGoal.toString())
    }
  }, [sleepGoal])

  // Save alarm sound preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("alarmSound", alarmSound.toString())
    }
  }, [alarmSound])

  // Save sleep notes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sleepNotes", sleepNotes)
    }
  }, [sleepNotes])

  // Save show tips preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("showTips", showTips.toString())
    }
  }, [showTips])

  // Initialize tips on component mount
  useEffect(() => {
    generateRandomTips()
  }, [])

  // Reset streak if 2 days are missed
  useEffect(() => {
    if (typeof window === "undefined") return

    const today = new Date().toDateString()
    const lastWakeup = localStorage.getItem("lastWakeupDate")

    if (lastWakeup) {
      const daysDifference = (new Date(today) - new Date(lastWakeup)) / (1000 * 3600 * 24)

      if (daysDifference > 2) {
        setChallengeStreak(0)
        localStorage.setItem("challengeStreak", "0")
      }
    }
  }, [])

  // Share progress
  const handleShare = () => {
    if (typeof navigator.share !== "undefined") {
      navigator
        .share({
          title: "My Sleep Progress",
          text: `I've maintained a ${challengeStreak}-day streak of waking up on time! Join me in the Oversleeping Prevention Challenge.`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error))
    } else {
      // Fallback for browsers that don't support the Web Share API
      alert("Share feature not supported in this browser")
    }
  }

  // Get sleep quality color
  const getSleepQualityColor = (quality) => {
    switch (quality) {
      case "Poor":
        return "bg-red-500"
      case "Average":
        return "bg-yellow-500"
      case "Good":
        return "bg-green-500"
      case "Excellent":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get progress color based on sleep duration vs goal
  const getProgressColor = () => {
    const duration = calculateSleepDuration()
    if (!duration) return "bg-gray-600"

    const hours = Number.parseFloat(duration)
    if (hours < sleepGoal - 2) return "bg-red-600"
    if (hours < sleepGoal - 1) return "bg-yellow-600"
    if (hours <= sleepGoal + 1) return "bg-green-600"
    return "bg-blue-600" // More than goal + 1
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    const duration = calculateSleepDuration()
    if (!duration) return 0

    const hours = Number.parseFloat(duration)
    return Math.min(Math.round((hours / sleepGoal) * 100), 100)
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="w-full bg-gray-900 border-gray-800 text-gray-100 shadow-xl">
        <CardHeader className="border-b border-gray-800">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlarmClock className="w-6 h-6 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Oversleeping Prevention Challenge
              </span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setActiveTab("settings")}>
              <Settings className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
            </Button>
          </div>
          <p className="text-gray-400 text-sm mt-1">Track your sleep habits and build a consistent wake-up routine</p>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 bg-gray-800 p-1 mx-4 mt-4">
            <TabsTrigger value="main" className="data-[state=active]:bg-gray-700">
              <BedDouble className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sleep</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-gray-700">
              <Trophy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="mt-0">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Sleep Time Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 transition-all hover:border-purple-500">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Bedtime</h3>
                    <div className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-blue-400" />
                      <Input
                        type="time"
                        value={bedtime}
                        onChange={(e) => setBedtime(e.target.value)}
                        className="bg-gray-700 border-gray-600 focus:border-purple-500 text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 transition-all hover:border-purple-500">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Wake-up Time</h3>
                    <div className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-yellow-400" />
                      <Input
                        type="time"
                        value={wakeTime}
                        onChange={(e) => setWakeTime(e.target.value)}
                        className="bg-gray-700 border-gray-600 focus:border-purple-500 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Sleep Duration */}
                {bedtime && wakeTime && (
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-400">Sleep Duration vs Goal</h3>
                      <Badge variant="outline" className="text-xs border-gray-700">
                        {calculateSleepDuration()} hrs / {sleepGoal} hrs
                      </Badge>
                    </div>
                    <Progress
                      value={calculateProgress()}
                      className="h-2 bg-gray-700"
                      indicatorClassName={getProgressColor()}
                    />
                  </div>
                )}

                {/* Sleep Quality Tracking */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-300">
                    <AlertCircle className="w-5 h-5 text-purple-400" />
                    How was your sleep quality?
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {["Poor", "Average", "Good", "Excellent"].map((quality) => (
                      <Button
                        key={quality}
                        variant={sleepQuality === quality ? "default" : "outline"}
                        onClick={() => handleSleepQuality(quality)}
                        className={`w-full transition-all ${
                          sleepQuality === quality
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300"
                        }`}
                      >
                        {quality}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sleep Notes */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-300">
                    <Info className="w-5 h-5 text-blue-400" />
                    Sleep Notes
                  </h3>
                  <textarea
                    value={sleepNotes}
                    onChange={(e) => setSleepNotes(e.target.value)}
                    placeholder="Note any factors that affected your sleep..."
                    className="w-full h-20 p-2 rounded-md bg-gray-700 border border-gray-600 focus:border-purple-500 text-white text-sm resize-none"
                  />
                </div>

                {/* Anti-Oversleeping Tips */}
                {showTips && (
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-300">
                      <Coffee className="w-5 h-5 text-yellow-400" />
                      Your Anti-Oversleeping Tips
                    </h3>
                    <ul className="space-y-2">
                      {sleepTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Motivational Message */}
                <div className="text-center bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-center mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
                    <h3 className="font-medium text-gray-300">Daily Motivation</h3>
                  </div>
                  <p className="italic text-sm text-gray-300">{motivationalMessage}</p>
                </div>

                {/* Wake-up Success Button */}
                <div className="text-center">
                  <Button
                    onClick={handleWakeupSuccess}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-6 text-lg transition-all"
                  >
                    I Successfully Woke Up! 🎉
                  </Button>
                </div>

                {/* Challenge Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-center flex-col hover:border-yellow-500 transition-all">
                    <Trophy className="w-6 h-6 mb-2 text-yellow-400" />
                    <p className="text-lg font-bold text-white">{challengeStreak}</p>
                    <p className="text-xs text-gray-400">Day Streak</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-center flex-col hover:border-blue-500 transition-all">
                    <Calendar className="w-6 h-6 mb-2 text-blue-400" />
                    <p className="text-lg font-bold text-white">{totalDaysTracked}</p>
                    <p className="text-xs text-gray-400">Total Days</p>
                  </div>
                </div>

                {/* Share Button */}
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share My Progress
                </Button>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Weekly Sleep Stats
                </h3>

                {/* Weekly Chart */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-end justify-between h-40">
                    {weeklyData.map((day, index) => (
                      <div key={index} className="flex flex-col items-center w-full">
                        <div className="relative w-full flex justify-center">
                          <div
                            className={`w-4/5 ${day.hours ? getProgressColor() : "bg-gray-700"}`}
                            style={{
                              height: `${day.hours ? (day.hours / 12) * 100 : 0}%`,
                              minHeight: day.hours ? "4px" : "0",
                            }}
                          >
                            {day.quality && (
                              <div
                                className={`absolute -top-2 -right-2 w-3 h-3 rounded-full ${getSleepQualityColor(day.quality)}`}
                                title={day.quality}
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-xs mt-2 text-gray-400">{day.day}</div>
                        <div className="text-xs text-gray-500">{day.hours || "-"}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sleep Quality Legend */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Sleep Quality Legend</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["Poor", "Average", "Good", "Excellent"].map((quality) => (
                      <div key={quality} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getSleepQualityColor(quality)}`}></div>
                        <span className="text-xs text-gray-300">{quality}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sleep Insights */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Sleep Insights</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span>
                        Your average sleep duration this week:{" "}
                        {weeklyData.reduce((acc, day) => acc + day.hours, 0) /
                          weeklyData.filter((day) => day.hours > 0).length || 0}{" "}
                        hours
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span>Most consistent wake-up time: {wakeTime || "Not enough data"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span>
                        Best sleep quality day:{" "}
                        {weeklyData.find((day) => day.quality === "Excellent")?.day || "None recorded"}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="achievements" className="mt-0">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Your Achievements
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(achievements) ? (
                    achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border ${
                          achievement.unlocked
                            ? "bg-gray-800 border-yellow-500"
                            : "bg-gray-900 border-gray-800 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${achievement.unlocked ? "bg-yellow-500/20" : "bg-gray-800"}`}
                          >
                            {achievement.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-200">{achievement.name}</h4>
                            <p className="text-xs text-gray-400">{achievement.description}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <p className="text-gray-300 text-center">Loading achievements...</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Achievement Progress</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {Array.isArray(achievements) ? achievements.filter((a) => a.unlocked).length : 0} /{" "}
                      {Array.isArray(achievements) ? achievements.length : possibleAchievements.length} Unlocked
                    </span>
                    <Progress
                      value={
                        Array.isArray(achievements)
                          ? (achievements.filter((a) => a.unlocked).length / achievements.length) * 100
                          : 0
                      }
                      className="h-2 w-1/2 bg-gray-700"
                      indicatorClassName="bg-yellow-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-400" />
                  Settings
                </h3>

                {/* Sleep Goal Setting */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="sleep-goal" className="text-sm font-medium text-gray-300">
                      Sleep Goal (hours)
                    </Label>
                    <span className="text-sm text-gray-400">{sleepGoal} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSleepGoal(Math.max(4, sleepGoal - 0.5))}
                      className="border-gray-700 text-gray-300 hover:bg-gray-700"
                    >
                      -
                    </Button>
                    <Input
                      id="sleep-goal"
                      type="range"
                      min="4"
                      max="12"
                      step="0.5"
                      value={sleepGoal}
                      onChange={(e) => setSleepGoal(Number.parseFloat(e.target.value))}
                      className="[&::-webkit-slider-thumb]:bg-purple-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSleepGoal(Math.min(12, sleepGoal + 0.5))}
                      className="border-gray-700 text-gray-300 hover:bg-gray-700"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Alarm Sound Setting */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {alarmSound ? (
                        <Volume2 className="h-5 w-5 text-blue-400" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-gray-400" />
                      )}
                      <Label htmlFor="alarm-sound" className="text-sm font-medium text-gray-300">
                        Alarm Sound
                      </Label>
                    </div>
                    <Switch id="alarm-sound" checked={alarmSound} onCheckedChange={setAlarmSound} />
                  </div>
                </div>

                {/* Show Tips Setting */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-5 w-5 text-yellow-400" />
                      <Label htmlFor="show-tips" className="text-sm font-medium text-gray-300">
                        Show Sleep Tips
                      </Label>
                    </div>
                    <Switch id="show-tips" checked={showTips} onCheckedChange={setShowTips} />
                  </div>
                </div>

                {/* Reset Data */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Reset Data</h4>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to reset all your sleep data? This cannot be undone.")) {
                          localStorage.clear()
                          window.location.reload()
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Reset All Data
                    </Button>
                    <p className="text-xs text-gray-400">
                      This will clear all your sleep data, achievements, and settings.
                    </p>
                  </div>
                </div>

                {/* About */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">About</h4>
                  <p className="text-xs text-gray-400">
                    Oversleeping Prevention Challenge v2.0
                    <br />
                    Build better sleep habits and wake up consistently.
                  </p>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

