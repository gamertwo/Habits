"use client"
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function NotificationsPage() {
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');

  const scheduleNotification = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/whatsapp/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time,
          date,
          message
        }),
      });
      if (response.ok) {
        setTime('');
        setMessage('');
        setDate('');
        alert('Notification scheduled successfully!');
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Schedule WhatsApp Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={scheduleNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schedule Reminder
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
