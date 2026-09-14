import { ChevronDown, FileCheck2 } from 'lucide-react'
import { useState } from 'react'

const teamRows = [
  ['Meetup attendance', 'Per member', '5', 'Adds 5 points for each verified attendee.'],
  ['Weekly challenge', 'Winner', '15', 'Team result.'],
  ['Weekly challenge', 'Runner-up / participation', '5 / 5', 'Both eligible outcomes award 5 points.'],
  ['Society project', 'Basic / intermediate / advanced', '10 / 20 / 30', 'Award follows the verified project level.'],
  ['Hackathon', '1st / 2nd / 3rd', '50 / 30 / 20', 'Placement determines the team award.'],
  ['Open source', 'Participation / PR raised', '10 / 10', 'Verified contribution activity.'],
  ['Open source', 'External merged / society merged', '20 / 25', 'Merged contributions receive the higher award.'],
  ['Final project', 'Winner / runner-up / other', '250 / 100 / 50', 'Final placement determines the team award.'],
]

const individualRows = [
  ['DSA streak', 'Regular / full streak', '20 / 100', 'Also counts toward the member’s team.'],
  ['Research paper', 'Published or accepted', '50', 'Also counts toward the member’s team.'],
  ['Blog / article', 'Published', '15', 'Also counts toward the member’s team.'],
  ['External event', 'Verified participation', '10', 'Also counts toward the member’s team.'],
  ['Tech talk', 'Delivery / publication / attendance', '10 / 10 / 10', 'Each eligible type is worth 10.'],
]

const sprintRows = [
  ['Winner', '30', 'Tracks: Code, Open Source, Build, Pitch.'],
  ['Runner-up', '25', 'Tracks: Code, Open Source, Build, Pitch.'],
  ['Participation', '15', 'Tracks: Code, Open Source, Build, Pitch.'],
  ['Full streak', '8', 'Awarded for completing the full sprint streak.'],
]

export function ScoringExplainer() {
  const [open, setOpen] = useState(false)
  return (
    <section className="score-explainer" aria-labelledby="scoring-title">
      <button
        type="button"
        className="score-explainer__toggle"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <span className="flex items-start gap-3">
          <FileCheck2 size={18} className="mt-0.5 text-lamp" aria-hidden="true" />
          <span>
            <span className="label text-lamp">Official scoring · 75 days</span>
            <strong id="scoring-title" className="mt-1 block font-display text-lg text-chalk">How points move the board</strong>
            <span className="mt-1 block text-xs leading-5 text-muted">Five teams: ASCEND, CIPHER, NEXUS, BYTE BRIGADE and ECHO.</span>
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="score-explainer__body">
          <p className="text-sm leading-6 text-muted">
            Team score = team-level activity + individual contribution points + eligible bonuses. Individual points also count toward the member's team.
          </p>
          <ScoreTable title="Team activities" headers={['Activity', 'Level / placement', 'Points', 'How it counts']} rows={teamRows} />
          <ScoreTable title="Individual scoreboard" headers={['Activity', 'Level / type', 'Points', 'Team impact']} rows={individualRows} />
          <ScoreTable title="Sprint track scoring" headers={['Result', 'Points', 'Notes']} rows={sprintRows} compact />
          <div className="mt-4 overflow-hidden rounded-slot border border-seam">
            <div className="border-b border-seam bg-lit px-3 py-2"><h3 className="label text-cyan">Rules</h3></div>
            <table className="score-table">
              <thead><tr><th scope="col">Proof requirement</th><th scope="col">False claim / plagiarism penalty</th></tr></thead>
              <tbody><tr><td>Proof is required for every claim and verified before points are awarded.</td><td>90% of the affected points are removed.</td></tr></tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

function ScoreTable({ title, headers, rows, compact = false }: { title: string; headers: string[]; rows: string[][]; compact?: boolean }) {
  return (
    <div className="mt-4 overflow-hidden rounded-slot border border-seam">
      <div className="border-b border-seam bg-lit px-3 py-2"><h3 className="label text-cyan">{title}</h3></div>
      <div className="overflow-x-auto">
        <table className={`score-table ${compact ? 'score-table--compact' : ''}`}>
          <thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.join('-')}>{row.map((cell, index) => <td key={`${cell}-${index}`} className={index === 2 || (compact && index === 1) ? 'score-table__points' : undefined}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}
