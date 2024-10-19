# Tasks

1. Create db models for Folders & Files

# Notes
Do I create actual folders in the disk storage? Or just dump everything into a user folder
prob the former to prevent naming collisions

Then the question is how do i get the folder information in the request. Can put folderId in the url params... will have to check folderId belongs to User

The model is: A User contains a main folder

Each folder can contain files or other folders

That is each folder will need to have a parent folder (except the main folder)

it'll be nice if each folder knew its path so it could be displayed to the user

the path of a child folder is parent folder's path + child folder's name

the path of the root folder can be Root or My Drive as it is in Google Drive

Deleting folder should 1. trigger a confirmation and 2. delete all files and folders inside

# Sketched Schema

User {
    Username
    Password
    CreatedAt
    RootFolderId
}

Folders {
    id
    ParentFolderId? (Nullable if it's the Root Folder)
    Files[]
    Path
    OwnerId
}

Files {
    OwnerId (is this needed? maybe repetitive since all files belong to a folder)
    FolderId
    ModifiedAt
    CreatedAt
}
