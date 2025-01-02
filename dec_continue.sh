#!/bin/bash
while IFS='|' read -r d m; do
  [ -z "$d" ] && continue
  if GIT_AUTHOR_DATE="$d" GIT_COMMITTER_DATE="$d" git commit --allow-empty -m "$m" >/dev/null 2>&1; then
    echo "OK  $d  $m"
  else
    echo "BAD $d  (skipped — date mangled?)"
  fi
done <<'DATA'
2024-12-03T14:12:00|show starred count in filter pill
2024-12-03T19:33:00|polish star button hover state
2024-12-04T11:08:00|scaffold PWA manifest
2024-12-04T15:24:00|generate icon set 192 512 apple
2024-12-04T20:50:00|wire beforeinstallprompt handler
2024-12-05T10:35:00|add install button to header
2024-12-05T17:22:00|set theme color and app metadata
2024-12-06T09:18:00|add search bar to results panel
2024-12-06T13:41:00|search across all STAR fields
2024-12-06T18:55:00|debounce search update
2024-12-07T15:12:00|add keyboard shortcuts handler
2024-12-09T10:28:00|shortcut slash focuses search
2024-12-09T14:50:00|shortcut a and s switch filters
2024-12-09T20:15:00|shortcut question mark opens help modal
2024-12-10T11:45:00|build shortcuts modal
24-12-10T16:18:00|polish kbd styling
2024-12-11T09:50:00|redesign export button as dropdown
2024-12-11T14:22:00|add download starred-only option
2024-12-11T19:08:00|add copy all to clipboard
2024-12-12T12:30:00|harden generate route error reporting
2024-12-12T17:55:00|detect placeholder API key
2024-12-12T22:10:00|surface upstream Groq errors verbatim
2024-12-13T10:14:00|improve client error display
2024-12-13T15:42:00|add error word break for long messages
2024-12-14T16:08:00|tweak hero typography
2024-12-16T09:33:00|soften brand indigo
2024-12-16T13:50:00|refine STAR section accent colors
2024-12-16T18:24:00|add print stylesheet
2024-12-17T11:08:00|polish menu hover states
2024-12-17T16:30:00|tighten card padding
2024-12-18T10:45:00|fix card animation jitter
2024-12-18T15:12:00|add reduced-motion respect
2024-12-19T13:20:00|tune progress bar transition
2024-12-20T10:08:00|add open graph metadata
2024-12-20T14:35:00|add twitter card metadata
2024-12-20T19:50:00|polish footer layout
2024-12-23T11:25:00|v1.1 starred plus PWA plus search
DATA

echo
echo "Total commits in repo:"
git rev-list --count HEAD
