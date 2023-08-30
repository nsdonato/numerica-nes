import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import tmi from 'tmi.js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import 'nes.css/css/nes.min.css'

enum Status {
  IDLE = 'IDLE',
  STARTED = 'STARTED',
  GAME_OVER = 'GAME_OVER'
}

interface Store {
  maxScore: number
  userMaxScore: string
  registerNewScore: (newScore: number, userMaxScore: string) => void
}

const useStore = create(
  persist<Store>(
    (set) => ({
      maxScore: 0,
      userMaxScore: '',
      registerNewScore: (newScore, userMaxScore) => {
        set((prev) => {
          if (newScore > prev.maxScore) {
            return {
              maxScore: newScore,
              userMaxScore: userMaxScore
            }
          } else {
            return {}
          }
        })
      }
    }),
    { name: 'numerica', version: 6 }
  )
)

export default function GamePage() {
  const { channel } = useParams<{ channel: string }>()

  const [twitchClient, setTwitchClient] = useState<tmi.Client | null>(null)

  useEffect(() => {
    if (!channel) return

    const twitchClient = new tmi.Client({ channels: [channel] })

    twitchClient.connect().catch(console.error)

    setTwitchClient(twitchClient)

    return () => {
      twitchClient.disconnect().catch(console.error)
    }
  }, [channel])

  const { maxScore, registerNewScore, userMaxScore } = useStore()
  const [state, setState] = useState({
    status: Status.IDLE,
    number: 0,
    user: ''
  })

  const handleNewMessage = useCallback(
    (
      _channel: string,
      tags: tmi.ChatUserstate,
      message: string,
      self: boolean
    ) => {
      if (self) return

      const user = tags.displayName || tags.username
      if (!user) return

      const number = Number(message)
      const isFiniteNumber = isFinite(number)
      const isIntegerNumber = number % 1 === 0
      const isPositiveNumber = number > 0
      if (!isFiniteNumber || !isIntegerNumber || !isPositiveNumber) return

      setState((prev) => {
        if (prev.user === user) return prev

        const isSuccess = number === prev.number + 1
        if (isSuccess) {
          registerNewScore(number, user)
          return {
            status: Status.STARTED,
            number: prev.number + 1,
            user: user
          }
        } else {
          return {
            status: prev.number === 0 ? Status.IDLE : Status.GAME_OVER,
            number: 0,
            user: user
          }
        }
      })
    },
    [setState, registerNewScore]
  )

  useEffect(() => {
    if (!twitchClient) return
    twitchClient.on('message', handleNewMessage)
    return () => {
      twitchClient.removeListener('message', handleNewMessage)
    }
  }, [twitchClient, handleNewMessage])

  return (
    <div className="nes-container is-dark with-title container">
      <p className="title">Numerica Nes</p>
      <div className="flex justify-evenly items-center w-full">
        {maxScore === 0 ? (
          <>
            <i className="nes-jp-logo"></i>
            <p className="text-sm">Start Game!</p>
          </>
        ) : (
          <>
            <i className="nes-icon trophy is-medium"></i>
            <span className="text-sm">
              Max Score: {maxScore}
              <br />
              by {userMaxScore}
            </span>
          </>
        )}
      </div>
      <div className="flex justify-center items-baseline pt-8">
        <p className="text-2xl max-score">{state.number} </p>
        <i
          key={state.number}
          className={`nes-icon coin is-medium ml-[20px] !origin-bottom ${
            state.number === 0 ? '' : 'bounce2'
          }`}
        ></i>
      </div>
      <p
        className={`text-base text-center font-bold whitespace-nowrap ${
          state.status === Status.GAME_OVER ? 'text-red-500' : ''
        }`}
      >
        {state.status === Status.GAME_OVER
          ? `Blame on
          ${state.user}!`
          : state.status === Status.STARTED
          ? state.user
          : ''}
      </p>
    </div>
  )
}
