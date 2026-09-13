import React from 'react'
import { useParams } from 'react-router-dom'
import { Board } from './Board'

export function CentralTeam({ hardcodedTeamId }: { hardcodedTeamId?: string }) {
  const params = useParams()
  const teamId = hardcodedTeamId || params.teamId

  return <Board hardcodedTeamId={teamId} />
}
