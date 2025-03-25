-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_comments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "published" TEXT NOT NULL,
    "updated" TEXT NOT NULL,
    "parentId" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_comments" ("content", "id", "parentId", "postId", "published", "updated", "userId") SELECT "content", "id", coalesce("parentId", 0) AS "parentId", "postId", "published", "updated", "userId" FROM "comments";
DROP TABLE "comments";
ALTER TABLE "new_comments" RENAME TO "comments";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
