'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserCheck, UserMinus, Loader2 } from 'lucide-react'
import { followOrganizer, unfollowOrganizer } from '@/lib/actions/follows'
import { createClient } from '@/lib/supabase/client'

interface FollowButtonProps {
  organizerId: string
  initialIsFollowing: boolean
  followersCount: number
  username: string | null
}

export function FollowButton({ organizerId, initialIsFollowing, followersCount, username }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [count, setCount] = useState(followersCount)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setUserId(session?.user?.id || null)
    }
    checkAuth()
  }, [])

  const formatCount = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return n.toString()
  }

  const handleToggle = async () => {
    if (!userId) {
      router.push(`/auth/login?redirect=/organizadores/${username || organizerId}`)
      return
    }

    // Don't allow following oneself
    if (userId === organizerId) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        const res = await unfollowOrganizer(organizerId)
        if (res.success) {
          setIsFollowing(false)
          setCount(c => Math.max(0, c - 1))
        }
      } else {
        const res = await followOrganizer(organizerId)
        if (res.success) {
          setIsFollowing(true)
          setCount(c => c + 1)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if it's the user's own profile
  if (userId === organizerId) return null

  if (!isFollowing) {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className="bg-primary text-white rounded-xl px-5 py-2.5 font-medium hover:bg-primary-hover transition-all flex items-center gap-2 disabled:opacity-70"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        Seguir · {formatCount(count)}
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="border-2 border-primary text-primary rounded-xl px-5 py-2.5 font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-all group flex items-center gap-2 disabled:opacity-70"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <UserCheck className="w-4 h-4 group-hover:hidden" />
          <UserMinus className="w-4 h-4 hidden group-hover:block" />
        </>
      )}
      <span className="group-hover:hidden">Seguindo</span>
      <span className="hidden group-hover:block">Deixar de seguir</span>
      <span className="mx-1">·</span>
      {formatCount(count)}
    </button>
  )
}
