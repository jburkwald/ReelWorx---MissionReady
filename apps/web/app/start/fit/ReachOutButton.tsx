'use client';

import { useState } from 'react';

// Intentful reach from the candidate (Feature 3.2). Spending a token to reach out is a
// deliberate, earned act, so it gets the Wrapped celebration. In the keyless demo this is a
// client-side moment (no candidate auth on web); the mobile app spends a real token via
// /api/apply.
export function ReachOutButton({ company }: { company: string }) {
  const [done, setDone] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  function reach() {
    if (done) return;
    setDone(true);
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 2600);
  }

  return (
    <>
      <button
        onClick={reach}
        disabled={done}
        className={done ? 'btn btn-ghost' : 'btn btn-spectrum'}
        style={{ height: 40, flex: 1 }}
      >
        {done ? '✓ You reached out' : 'Reach out'}
      </button>
      {celebrate ? (
        <div className="celebrate" onClick={() => setCelebrate(false)}>
          <div className="big">
            <div>You</div>
            <div>reached out</div>
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, maxWidth: 280, margin: 0, opacity: 0.95 }}>
            That took a token, so {company} knows you mean it.
          </p>
        </div>
      ) : null}
    </>
  );
}
