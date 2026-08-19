SKILL ids in src/data/skills/silkbind-jade/ids.ts match the SKILL.\* references in the skill files.



Skill literals use defineSkill(...) and hit(...) consistently; hit shapes, frames, multipliers, and triggers look syntactically correct.



applyDebuff(...) in umbdronelaunch-26hit references DEBUFF.umbDrone26Hit correctly.



Imports use the expected relative paths (../ids, definitions helpers).



No unrelated modules were changed in this diff.



Cosmetic: several new files were missing a final newline. Appended EOF newlines in a tiny local commit, please confirm you want that included, or can remove it from this branch if you prefer no cosmetic commits in the PR.

