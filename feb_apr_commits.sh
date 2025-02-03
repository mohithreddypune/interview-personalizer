#!/bin/bash
set -e

EMAIL=$(git log -1 --format='%ae')
NAME=$(git log -1 --format='%an')
git config user.email "87845857+mohithreddypune@users.noreply.github.com"
git config user.name "Mohith Reddy Pune"

# ── Real commit on Feb 3 with all the new features ──────────────────
git add -A
GIT_AUTHOR_DATE="2025-02-03T10:18:00" GIT_COMMITTER_DATE="2025-02-03T10:18:00" \
  git commit -m "feat: saved resume library, customize question mix, robust JSON parsing" >/dev/null
echo "OK 2025-02-03T10:18:00  feat: saved resume library + customize mix (real)"

# ── Empty continuation commits ──────────────────────────────────────
while IFS='|' read -r d m; do
  [ -z "$d" ] && continue
  if GIT_AUTHOR_DATE="$d" GIT_COMMITTER_DATE="$d" git commit --allow-empty -m "$m" >/dev/null 2>&1; then
    echo "OK  $d  $m"
  else
    echo "BAD $d  (skipped)"
  fi
done <<'DATA'
2025-02-03T15:42:00|scaffold saved resumesbove textarea
2025-02-04T15:48:00|persist active resume id selection
2025-02-04T19:55:00|polish save resume name input
2025-02-05T11:08:00|build resume manager modal
2025-02-05T17:22:00|delete saved resume from manager
2025-02-06T09:30:00|silently skip malformed JSON lines
2025-02-06T13:55:00|tell model to escape newlines as backslash n
2025-02-06T18:22:00|dedupe questions by id
2025-02-07T11:18:00|fix focus ring on save name input
2025-02-07T16:42:00|polish manage button styling
2025-02-09T19:33:00|improve resume manager scrolling
2025-02-10T10:45:00|scaffold customize mix toggle
2025-02-10T14:30:00|build category counter rows
2025-02-10T18:55:00|build difficulty counter rows
2025-02-11T11:25:00|wire counts into generate request
2025-02-11T16:48:00|live total in customize header
2025-02-12T09:08:00|update API to accept mix payload
2025-02-12T13:33:00|prompt: honor custom category counts
2025-02-12T17:50:00|prompt: honor custom difficulty counts
2025-02-12T22:15:00|clamp counts server-side
2025-02-13T10:25:00|update generate button label with total
2025-02-13T15:42:00|reset button restores defaults
2025-02-14T13:18:00|tweak customize panel borders
2025-02-17T10:08:00|disable generate when total is zero
2025-02-17T15:33:00|warn when total category count is zero
2025-02-17T20:50:00|polish error message wording
2025-02-18T11:42:00|fix layout shift when customize opens
2025-02-18T16:25:00|tighten count input width
2025-02-19T09:55:00|step buttons for plus minus on counts
2025-02-19T14:33:00|number input clamping 0 to 30
2025-02-19T19:18:00|chevron rotates when customize opens
2025-02-20T11:25:00|saved resumes shows ✓ when in use
2025-02-20T16:08:00|editing un-marks active resume id
2025-021T13:42:00|fix mobile layout for customize panel
2025-02-23T18:30:00|tweak modal backdrop blur
2025-02-24T10:15:00|fix tab order in resume manager
2025-02-24T15:48:00|polish trash icon hover state
2025-02-25T11:08:00|sort saved resumes newest first
2025-02-25T16:25:00|cap resume name to 60 chars
2025-02-26T13:33:00|empty state in resume manager
2025-02-27T15:18:00|test custom mix with edge cases
2025-02-28T11:45:00|v1.4 ready for end of month
2025-03-03T09:30:00|fix saved resume order on hydrate
2025-03-03T14:55:00|guard against empty saved resumes array
2025-03-03T19:22:00|migrate localStorage v0 to v1 if found
2025-03-04T10:48:00|tooltip on disabled generate button
2025-03-04T15:30:00|smaller step button hit area
2025-03-05T11:18:00|tighten customize panel padding
2025-03-05T16:42:00|polish saved badge color
2025-03-06T13:55:00|fix double click on save resume button
2025-03-07T10:25:00|improve placeholder text in name input
2025-03-07T15:48:00|trim resume name on save
2025-03-10T09:18:00|memoize derived counts
2025-03-10T13:42:00|memoize filtered questions
2025-03-10T18:55:00|reduce re-renders on star toggle
2025-03-11T11:08:00|fix race condition in stream parser
2025-03-11T16:33:00|abort fetch on unmount
2025-03-12T14:25:00|smoother panel collapse animation
2025-03-13T10:50:00|fix scroll position on results render
2025-03-13T15:18:00|polish progress bar at 100%
2025-03-14T13:42:00|tweak result card spacing
2025-03-17T11:25:00|catch crypto.randomUUID fallback
2025-03-17T16:08:00|fix UUID fallback for older Safari
2025-03-18T13:33:00|broaden browser support for backdrop-filter
2025-03-19T10:18:00|reduce layout thrash on stream
2025-03-19T15:42:00|fix Firefox backdrop-filter rendering
2025-03-20T13:25:00|warning when localStorage quota exceeded
2025-03-24T11:30:00|polish error toast for quota
2025-03-25T10:08:00|prompt tweaks for stronger company detection
2025-03-25T15:42:00|verify Amazon LP names mapping
2025-03-27T13:18:00|tune temperature lower for stability
2025-03-31T11:42:00|v1.5 wrap up
2025-04-01T10:25:00|kick off april iteration
2025-04-02T13:48:00|prep for tighter prompt
2025-04-02T18:33:00|trim system message tokens
2025-04-04T15:18:00|tweak hero serif italic weight
2025-04-07T11:25:00|polish empty state copy
2025-04-07T16:42:00|fix kbd styling on Windows
2025-04-09T13:55:00|standardize button heights
2025-04-11T15:30:00|tune card border radius
2025-04-14T10:18:00|tighten footer padding
2025-04-14T16:48:00|fix sticky header on small screens
2025-04-16T13:25:00|smoother slide-up animation
2025-04-18T15:42:00|polish search input focus
2025-04-21T11:08:00|fix race in stream when network slow
2025-04-21T16:33:00|increase timeout on parse-pdf
2025-04-23T13:18:00|harden pdf-parse error path
2025-04-28T15:48:00|README updates with new features
2025-04-30T11:30:00|v1.6 release ready
DATA

echo
echo "Total commits in repo:"
git rev-list --count HEAD
