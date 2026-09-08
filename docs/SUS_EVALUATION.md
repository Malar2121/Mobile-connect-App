# System Usability Scale (SUS) evaluation

> **Status: PREPARED — NOT YET RUN.**
>
> This document is the instrument, protocol and scoring method. It contains **no
> participant data and no score**, because none has been collected. A SUS score
> is only meaningful when it comes from real people using the real app, and
> fabricating one would invalidate the evaluation.
>
> Fill in §6 and §7 after running the sessions.

---

## 1. Why SUS

The project's literature review notes that the System Usability Scale "has been
widely used to evaluate how comfortable and effective" systems are for users of
varying ages, and Objective 8 requires testing usability with families. SUS is
appropriate here because Family Connect deliberately serves a wide age range —
children, adults, and elders — and SUS produces a single comparable number
across those groups.

SUS is the standard 10-item questionnaire (Brooke, 1996), scored 0–100.

---

## 2. Participants

The project proposal does **not** specify a participant count or demographic
criteria, so none is claimed here as a requirement. The proposal does describe
"pilot testing with extended family members" (§5.2), which suggests recruiting
from your own extended family.

Recommended, as good practice rather than a proposal mandate:

- **At least 5 participants.** SUS is usable from 5; more narrows the confidence
  interval.
- **Spread the age range**, since Elder Mode and the child experience are
  explicit objectives. Aim for at least one participant in each of: a child or
  teenager (with guardian present and consenting), an adult, and an elder.
- Record each participant's **age band** and **first language** (English,
  Sinhala, or Tamil) — these let you segment the results, which is the
  interesting part for this project.

Record participants as P1, P2, … Do not record names.

---

## 3. Before the session

- Have a working build installed on the participant's own device where possible.
- Have a test family prepared, or let the participant create one as task 1.
- Explain that **the app is being tested, not the participant**, and that they
  may stop at any time.
- For a participant under 18, obtain guardian consent first, and have the
  guardian present.
- Do not coach during tasks. Note where they hesitate — that is the useful data.

---

## 4. Task scenarios

Give these one at a time, in the participant's own language where possible.

| # | Task | Covers |
|---|---|---|
| T1 | Create an account and set up a family called "Test Family". | Registration, family creation |
| T2 | Invite someone to your family — by any method you like. | Invite code / QR / email |
| T3 | Create an event for next Saturday called "Family Lunch". | Event scheduling |
| T4 | Ask your family which of two dates suits them, then find the best date. | Availability polling, Smart Date Suggestion |
| T5 | Add your date of birth to your profile, then find where birthdays appear. | Celebration calendar |
| T6 | Upload a photo to the family memories. | Memory archive |
| T7 | Send a message to the family and mention someone in it. | Chat, mentions |
| T8 | Change the app's language to Sinhala or Tamil, then change it back. | Multilingual interface |
| T9 | Turn on Elder Mode and describe what changed. | Accessibility (elders especially) |

For each task record: **completed unaided / completed with help / not completed**,
plus time taken and anything the participant said aloud.

---

## 5. The questionnaire

Administer immediately after the tasks. Responses are 1 = Strongly disagree to
5 = Strongly agree.

| # | Statement |
|---|---|
| 1 | I think that I would like to use this app frequently. |
| 2 | I found the app unnecessarily complex. |
| 3 | I thought the app was easy to use. |
| 4 | I think that I would need the support of a technical person to be able to use this app. |
| 5 | I found the various functions in this app were well integrated. |
| 6 | I thought there was too much inconsistency in this app. |
| 7 | I would imagine that most people would learn to use this app very quickly. |
| 8 | I found the app very cumbersome to use. |
| 9 | I felt very confident using the app. |
| 10 | I needed to learn a lot of things before I could get going with this app. |

Translations for Sinhala and Tamil participants should be prepared before the
session and reviewed by a fluent speaker; a mistranslated item invalidates that
response.

---

## 6. Response collection

Record raw 1–5 responses. **This table is intentionally empty.**

| Participant | Age band | Language | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | | | | | |
| P2 | | | | | | | | | | | | |
| P3 | | | | | | | | | | | | |
| P4 | | | | | | | | | | | | |
| P5 | | | | | | | | | | | | |

---

## 7. Scoring

For each participant:

1. **Odd-numbered items (1, 3, 5, 7, 9):** score = response − 1
2. **Even-numbered items (2, 4, 6, 8, 10):** score = 5 − response
3. Sum the ten adjusted scores (range 0–40)
4. Multiply by 2.5 → that participant's SUS score (0–100)

The study's SUS score is the **mean** across participants. Report the mean, the
range, and the number of participants.

**Worked example.** A participant answering 4,2,4,2,4,2,4,2,4,2 gives adjusted
scores of 3,3,3,3,3,3,3,3,3,3 = 30 → 30 × 2.5 = **75**.

### Interpreting the result

The commonly cited benchmark (Sauro & Lewis) places the average SUS score for
software at roughly 68. Above ~68 is above average; below suggests usability
problems worth investigating. Report the number honestly whatever it is — a
mediocre score with a clear analysis of *why* is a stronger result than a good
number with no explanation.

| Result | | |
|---|---|---|
| Participants (n) | | *to be completed* |
| Mean SUS score | | *to be completed* |
| Range (min–max) | | *to be completed* |
| By age band | | *to be completed* |
| By language | | *to be completed* |

---

## 8. Reporting

In the final report, state:

- how many participants took part and how they were recruited
- the mean SUS score and its range
- task completion rates per scenario
- the specific usability problems observed, and what you changed as a result
- any limitation — for example a small sample, or all participants sharing a
  first language

Do not report a SUS score without stating n.

---

## Reference

Brooke, J. (1996). SUS: A "quick and dirty" usability scale. In *Usability
Evaluation in Industry*. Taylor & Francis.
