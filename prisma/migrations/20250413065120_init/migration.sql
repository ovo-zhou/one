-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uid" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" TEXT NOT NULL,
    "updated" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "img" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "published" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "comments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "published" TEXT NOT NULL,
    "updated" TEXT NOT NULL,
    "parentId" INTEGER NOT NULL DEFAULT 0
);
