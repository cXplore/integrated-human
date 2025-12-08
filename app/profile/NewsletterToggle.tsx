'use client';

import { useState, useEffect } from 'react';

export default function NewsletterToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.newsletterSubscribed);
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  async function handleToggle() {
    setIsSaving(true);
    const newValue = !isSubscribed;

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterSubscribed: newValue }),
      });

      if (response.ok) {
        setIsSubscribed(newValue);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-between items-center py-3 border-b border-zinc-800">
        <span className="text-gray-400">Newsletter</span>
        <div className="w-12 h-6 bg-zinc-700 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center py-3 border-b border-zinc-800">
      <div>
        <span className="text-gray-400">Newsletter</span>
        <p className="text-xs text-gray-500 mt-1">
          Receive new articles and updates
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={isSaving}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          isSubscribed ? 'bg-green-600' : 'bg-zinc-700'
        } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={isSubscribed ? 'Unsubscribe from newsletter' : 'Subscribe to newsletter'}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            isSubscribed ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
