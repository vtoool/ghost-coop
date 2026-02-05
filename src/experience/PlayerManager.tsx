import { usePlayersList, myPlayer } from 'playroomkit'
import HunterController from './HunterController'
import RemotePlayer from './RemotePlayer'

export default function PlayerManager() {
  const players = usePlayersList(true)
  const me = myPlayer()

  return (
    <>
      {players.map((p) => {
        const isLocal = p.id === me?.id
        return isLocal ? (
          <HunterController key={p.id} />
        ) : (
          <RemotePlayer key={p.id} player={p} />
        )
      })}
    </>
  )
}
