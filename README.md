## Getting Started

### run the server

to start the server run:
```bash
docker compose up
```

### create an encryption key

to create an encryption key run this script:
```bash
./scripts/create_new_encryption_key.sh
```

### viewing the project

Open localhost:3000 with your browser to see the website.

Open localhost:5555 with your browser to see the database using prisma studio.

test the python api by opening localhost:8000 with the corresponding path.

## Development

### using prisma ORM

to import prisma you can do this
```typescript
import { prisma } from "@/lib/prisma";
```

