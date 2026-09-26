# Demo photos

`npm run demo:seed` uploads these files to the project's Cloudinary account
(folder `family_connect/demo`) and stores the resulting address in the existing
fields: `User.avatar`, `Event.image` and `Memory.mediaUrl`.

| File name | Used for |
|---|---|
| `avatar-arjun.jpg` | Arjun Perera's profile photo |
| `avatar-nadeesha.jpg` | Nadeesha Perera's profile photo |
| `avatar-kavindu.jpg` | Kavindu Perera's profile photo |
| `avatar-kamala.jpg` | Kamala Perera's profile photo |
| `event-family-weekend.jpg` | Cover of the Family Weekend Gathering event |
| `event-family-picnic.jpg` | Cover of the Family Picnic event |
| `memory-family-dinner.jpg` | Family Dinner memory |
| `memory-weekend-trip.jpg` | Weekend Trip memory |
| `memory-new-year.jpg` | New Year Celebration memory |
| `memory-family-gathering.jpg` | Family Gathering memory |

`.jpeg`, `.png` and `.webp` also work. Without a file, people show initials,
events have no cover and memories use placeholder photos from picsum.photos.

Each photo is uploaded once. To swap one later, clear that record's field in the
database before seeding again.

Where each image comes from, and its licence, is recorded in `SOURCES.md`. Only
use photos you have the right to use. The image files are ignored by git.
